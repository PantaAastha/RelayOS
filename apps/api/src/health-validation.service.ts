// Health Validation Service
// Comprehensive checks for all system components

import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LLMService } from './modules/llm/llm.service';
import { N8nService } from './modules/n8n/n8n.service';

export interface CheckResult {
    status: 'ok' | 'error' | 'skipped';
    latencyMs?: number;
    error?: string;
    details?: Record<string, unknown>;
}

export interface ValidationResult {
    status: 'ok' | 'partial' | 'error';
    timestamp: string;
    checks: {
        database: CheckResult;
        llm: CheckResult;
        pgvector: CheckResult;
        n8n: CheckResult;
        rag: CheckResult;
    };
}

@Injectable()
export class HealthValidationService {
    private supabase: SupabaseClient | null = null;

    constructor(
        private configService: ConfigService,
        private llmService: LLMService,
        private n8nService: N8nService,
        @Inject('N8N_ENABLED') private readonly n8nEnabled: boolean,
    ) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (supabaseUrl && serviceRoleKey) {
            this.supabase = createClient(supabaseUrl, serviceRoleKey);
        }
    }

    /**
     * Run all validation checks
     */
    async validate(): Promise<ValidationResult> {
        const [database, llm, pgvector, n8n, rag] = await Promise.all([
            this.checkDatabase(),
            this.checkLLM(),
            this.checkPgVector(),
            this.checkN8n(),
            this.checkRAG(),
        ]);

        // Determine overall status
        const checks = { database, llm, pgvector, n8n, rag };
        const checkValues = Object.values(checks);
        const hasError = checkValues.some(c => c.status === 'error');
        const allOk = checkValues.every(c => c.status === 'ok' || c.status === 'skipped');

        return {
            status: hasError ? (allOk ? 'partial' : 'error') : 'ok',
            timestamp: new Date().toISOString(),
            checks,
        };
    }

    /**
     * Check database connectivity
     */
    private async checkDatabase(): Promise<CheckResult> {
        if (!this.supabase) {
            return {
                status: 'error',
                error: 'Database not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)',
            };
        }

        const start = Date.now();
        try {
            const { error } = await this.supabase
                .from('documents')
                .select('count', { count: 'exact', head: true });

            if (error) {
                return {
                    status: 'error',
                    latencyMs: Date.now() - start,
                    error: error.message,
                };
            }

            return {
                status: 'ok',
                latencyMs: Date.now() - start,
            };
        } catch (error) {
            return {
                status: 'error',
                latencyMs: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Check LLM provider connectivity
     */
    private async checkLLM(): Promise<CheckResult> {
        const start = Date.now();
        try {
            // Try a simple completion
            const result = await this.llmService.complete([
                { role: 'user', content: 'Say "OK" and nothing else.' },
            ], { maxTokens: 10 });

            return {
                status: 'ok',
                latencyMs: Date.now() - start,
                details: {
                    provider: this.llmService.providerName,
                    model: result.model,
                    tokensUsed: result.tokensUsed.total,
                },
            };
        } catch (error) {
            return {
                status: 'error',
                latencyMs: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
                details: {
                    provider: this.llmService.providerName,
                },
            };
        }
    }

    /**
     * Check pgvector extension is working
     */
    private async checkPgVector(): Promise<CheckResult> {
        if (!this.supabase) {
            return { status: 'skipped', error: 'Database not configured' };
        }

        const start = Date.now();
        try {
            // Try to query the match_documents function (which uses pgvector)
            // Use a dummy embedding that will return no results
            const dummyEmbedding = new Array(768).fill(0);

            const { error } = await this.supabase.rpc('match_documents', {
                query_embedding: dummyEmbedding,
                match_tenant_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for validation
                match_count: 1,
                match_threshold: 0.99,
            });

            if (error) {
                // If it's just "no results", that's fine
                if (error.message.includes('result')) {
                    return {
                        status: 'ok',
                        latencyMs: Date.now() - start,
                    };
                }
                return {
                    status: 'error',
                    latencyMs: Date.now() - start,
                    error: error.message,
                };
            }

            return {
                status: 'ok',
                latencyMs: Date.now() - start,
            };
        } catch (error) {
            return {
                status: 'error',
                latencyMs: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Check n8n webhook reachability
     */
    private async checkN8n(): Promise<CheckResult> {
        if (!this.n8nEnabled || !this.n8nService.isEnabled()) {
            return {
                status: 'skipped',
                details: { reason: 'n8n integration is disabled' },
            };
        }

        const start = Date.now();
        try {
            // Try to trigger the health webhook (won't do anything but confirms connectivity)
            const success = await this.n8nService.triggerWorkflow('health-check', {
                type: 'health_check',
                timestamp: new Date().toISOString(),
            });

            return {
                status: success ? 'ok' : 'error',
                latencyMs: Date.now() - start,
                error: success ? undefined : 'Webhook call failed',
            };
        } catch (error) {
            return {
                status: 'error',
                latencyMs: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Check RAG pipeline (documents exist)
     */
    private async checkRAG(): Promise<CheckResult> {
        if (!this.supabase) {
            return { status: 'skipped', error: 'Database not configured' };
        }

        const start = Date.now();
        try {
            // Count documents and chunks
            const [docsResult, chunksResult] = await Promise.all([
                this.supabase.from('documents').select('count', { count: 'exact', head: true }),
                this.supabase.from('document_chunks').select('count', { count: 'exact', head: true }),
            ]);

            if (docsResult.error || chunksResult.error) {
                return {
                    status: 'error',
                    latencyMs: Date.now() - start,
                    error: docsResult.error?.message || chunksResult.error?.message,
                };
            }

            const documentsCount = docsResult.count || 0;
            const chunksCount = chunksResult.count || 0;

            return {
                status: 'ok',
                latencyMs: Date.now() - start,
                details: {
                    documentsCount,
                    chunksCount,
                    hasContent: documentsCount > 0,
                },
            };
        } catch (error) {
            return {
                status: 'error',
                latencyMs: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
