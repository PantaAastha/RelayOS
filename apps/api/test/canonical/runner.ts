// Canonical Question Pack Runner v2
// Supports advanced question packs with must_include, should_include, success_criteria, and numeric_checks

import * as fs from 'fs';
import * as path from 'path';

// ============== Types ==============

interface NumericCheck {
    label: string;
    expected: number;
    unit: string;
    tolerance: number;
}

interface ExpectedCriteria {
    must_include?: string[];
    should_include?: string[];
    success_criteria?: string[];
    numeric_checks?: NumericCheck[];
    answer_format?: string;
}

interface Question {
    id: string;
    type: string;
    prompt: string;
    expected: ExpectedCriteria;
    persona?: string;
    evidence_pages?: number[];
    document_rationale_pages?: number[];
}

interface Pack {
    pack_id: string;
    description: string;
    questions: Question[];
}

interface QuestionPack {
    meta: {
        pack_name: string;
        purpose: string;
        generated_at_local: string;
        timezone: string;
        source_document?: {
            title: string;
            file: string;
            pages: number;
        };
        evaluation_notes?: string[];
    };
    packs: Pack[];
}

interface EvaluationResult {
    id: string;
    type: string;
    prompt: string;
    pack_id: string;
    passed: boolean;
    response: string;
    confidence: number;
    grade: string;
    evaluation: {
        must_include: { matched: string[]; missing: string[] };
        should_include: { matched: string[]; missing: string[] };
        success_criteria: { criteria: string; likely_met: boolean }[];
        numeric_checks: { label: string; expected: number; found: number | null; passed: boolean }[];
    };
    error?: string;
}

// ============== Configuration ==============

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TENANT_ID = process.env.TENANT_ID || '';
const ASSISTANT_ID = process.env.ASSISTANT_ID || '';
const VERBOSE = process.env.VERBOSE === 'true';

// ============== API Client ==============

async function sendMessage(tenantId: string, message: string): Promise<{
    content: string;
    confidence: number;
    grade: string;
}> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (process.env.ASSISTANT_ID) {
        headers['x-assistant-id'] = process.env.ASSISTANT_ID;
    } else {
        headers['x-tenant-id'] = tenantId;
    }

    const response = await fetch(`${API_URL}/conversation/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: message }),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
        content: data.response?.content || '',
        confidence: data.response?.confidence || 0,
        grade: data.response?.grade || 'UNKNOWN',
    };
}

// ============== Evaluation Functions ==============

function checkPatterns(content: string, patterns: string[]): { matched: string[]; missing: string[] } {
    const contentLower = content.toLowerCase();
    const matched: string[] = [];
    const missing: string[] = [];

    for (const pattern of patterns) {
        // Check for phrase match (case-insensitive, allows flexible matching)
        const patternLower = pattern.toLowerCase();
        // Split compound patterns (e.g., "education/upskilling") and check if any part matches
        const parts = patternLower.split(/[\/\+&]/);
        const anyMatch = parts.some(part => contentLower.includes(part.trim()));

        if (anyMatch) {
            matched.push(pattern);
        } else {
            missing.push(pattern);
        }
    }

    return { matched, missing };
}

function extractNumbers(content: string): number[] {
    // Extract all numbers from content (including decimals and percentages)
    const matches = content.match(/\d+\.?\d*/g) || [];
    return matches.map(m => parseFloat(m));
}

function checkNumeric(content: string, checks: NumericCheck[]): { label: string; expected: number; found: number | null; passed: boolean }[] {
    const numbers = extractNumbers(content);

    return checks.map(check => {
        // Find the closest number to expected within tolerance
        let found: number | null = null;
        let passed = false;

        for (const num of numbers) {
            if (Math.abs(num - check.expected) <= check.tolerance) {
                found = num;
                passed = true;
                break;
            }
        }

        // If no exact match, find closest
        if (found === null && numbers.length > 0) {
            found = numbers.reduce((prev, curr) =>
                Math.abs(curr - check.expected) < Math.abs(prev - check.expected) ? curr : prev
            );
        }

        return { label: check.label, expected: check.expected, found, passed };
    });
}

function evaluateSuccessCriteria(content: string, criteria: string[]): { criteria: string; likely_met: boolean }[] {
    // Simple heuristic evaluation of success criteria
    // In production, this could use an LLM for better evaluation

    return criteria.map(criterion => {
        const criterionLower = criterion.toLowerCase();
        const contentLower = content.toLowerCase();

        let likely_met = false;

        // Extract key phrases from criterion and check if content addresses them
        const keyPhrases = criterionLower
            .replace(/produces?|provides?|includes?|gives?|contains?|covers?|has|shows?/gi, '')
            .split(/[,;]/)
            .map(p => p.trim())
            .filter(p => p.length > 3);

        // Check if at least half of key concepts are present
        const matches = keyPhrases.filter(phrase => {
            const words = phrase.split(/\s+/).filter(w => w.length > 3);
            return words.some(word => contentLower.includes(word));
        });

        likely_met = keyPhrases.length === 0 || matches.length >= keyPhrases.length * 0.5;

        return { criteria: criterion, likely_met };
    });
}

function evaluateQuestion(question: Question, response: { content: string; confidence: number; grade: string }, packId: string): EvaluationResult {
    const expected = question.expected;

    // For boundary types (out_of_scope, false_premise), must_include contains
    // ALTERNATIVE phrases — any ONE match is sufficient (the system might say
    // "I don't have" OR "I cannot" OR "I'm unable" — all are valid refusals).
    const isBoundaryType = ['out_of_scope', 'false_premise'].includes(question.type);

    // Evaluate must_include
    const mustIncludeResult = expected.must_include
        ? checkPatterns(response.content, expected.must_include)
        : { matched: [], missing: [] };

    // Evaluate should_include
    const shouldIncludeResult = expected.should_include
        ? checkPatterns(response.content, expected.should_include)
        : { matched: [], missing: [] };

    // Evaluate success_criteria
    const successCriteriaResult = expected.success_criteria
        ? evaluateSuccessCriteria(response.content, expected.success_criteria)
        : [];

    // Evaluate numeric_checks
    const numericCheckResult = expected.numeric_checks
        ? checkNumeric(response.content, expected.numeric_checks)
        : [];

    // Determine pass/fail
    // For boundary types: pass if ANY must_include pattern found (any-one-of)
    // For normal types: pass if ALL must_include patterns found (all-of)
    // Always: all numeric_checks passed, ≥50% success_criteria likely met

    const mustIncludePass = isBoundaryType
        ? (mustIncludeResult.matched.length > 0 || (expected.must_include?.length ?? 0) === 0)
        : mustIncludeResult.missing.length === 0;
    const numericPass = numericCheckResult.every(r => r.passed) || numericCheckResult.length === 0;
    const criteriaLikely = successCriteriaResult.filter(r => r.likely_met).length;
    const criteriaPass = successCriteriaResult.length === 0 || criteriaLikely >= successCriteriaResult.length * 0.5;

    const passed = mustIncludePass && numericPass && criteriaPass;

    return {
        id: question.id,
        type: question.type,
        prompt: question.prompt.substring(0, 80) + (question.prompt.length > 80 ? '...' : ''),
        pack_id: packId,
        passed,
        response: response.content.substring(0, 300) + (response.content.length > 300 ? '...' : ''),
        confidence: response.confidence,
        grade: response.grade,
        evaluation: {
            must_include: mustIncludeResult,
            should_include: shouldIncludeResult,
            success_criteria: successCriteriaResult,
            numeric_checks: numericCheckResult,
        },
    };
}

// ============== Test Runner ==============

async function runTests(pack: QuestionPack, tenantId: string): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];
    let totalQuestions = 0;

    for (const p of pack.packs) {
        totalQuestions += p.questions.length;
    }

    console.log(`\n🧪 Running ${totalQuestions} canonical questions across ${pack.packs.length} packs...\n`);
    console.log(`   API: ${API_URL}`);
    console.log(`   Tenant: ${tenantId}\n`);

    for (const p of pack.packs) {
        console.log('─'.repeat(70));
        console.log(`📦 Pack: ${p.pack_id}`);
        console.log(`   ${p.description}`);
        console.log('─'.repeat(70));

        for (const question of p.questions) {
            const shortPrompt = question.prompt.substring(0, 50).replace(/\n/g, ' ');
            process.stdout.write(`  [${question.id}] ${shortPrompt}... `);

            try {
                const response = await sendMessage(tenantId, question.prompt);
                const result = evaluateQuestion(question, response, p.pack_id);
                results.push(result);

                const icon = result.passed ? '✅' : '❌';
                console.log(`${icon} ${result.passed ? 'PASS' : 'FAIL'}`);

                if (VERBOSE && !result.passed) {
                    console.log(`     Missing: ${result.evaluation.must_include.missing.join(', ') || 'none'}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.push({
                    id: question.id,
                    type: question.type,
                    prompt: question.prompt.substring(0, 80),
                    pack_id: p.pack_id,
                    passed: false,
                    response: '',
                    confidence: 0,
                    grade: 'ERROR',
                    evaluation: {
                        must_include: { matched: [], missing: question.expected.must_include || [] },
                        should_include: { matched: [], missing: [] },
                        success_criteria: [],
                        numeric_checks: [],
                    },
                    error: errorMessage,
                });
                console.log(`❌ ERROR: ${errorMessage}`);
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    return results;
}

// ============== Reporting ==============

function printReport(results: EvaluationResult[], pack: QuestionPack) {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const passRate = ((passed / results.length) * 100).toFixed(1);

    console.log('\n' + '═'.repeat(70));
    console.log('📊 CANONICAL QUESTION PACK RESULTS');
    console.log('═'.repeat(70));
    console.log(`   Pack: ${pack.meta.pack_name}`);
    console.log(`   Source: ${pack.meta.source_document?.title || 'N/A'}`);
    console.log('─'.repeat(70));
    console.log(`   Total:  ${results.length}`);
    console.log(`   Passed: ${passed} (${passRate}%)`);
    console.log(`   Failed: ${failed}`);
    console.log('─'.repeat(70));

    // Results by pack
    console.log('\n📦 Results by Pack:\n');
    for (const p of pack.packs) {
        const packResults = results.filter(r => r.pack_id === p.pack_id);
        const packPassed = packResults.filter(r => r.passed).length;
        const packRate = ((packPassed / packResults.length) * 100).toFixed(0);
        const bar = '█'.repeat(Math.round(packPassed / packResults.length * 20)) + '░'.repeat(20 - Math.round(packPassed / packResults.length * 20));
        console.log(`   ${p.pack_id}: ${bar} ${packPassed}/${packResults.length} (${packRate}%)`);
    }

    // Results by type
    console.log('\n📋 Results by Type:\n');
    const types = [...new Set(results.map(r => r.type))];
    for (const type of types) {
        const typeResults = results.filter(r => r.type === type);
        const typePassed = typeResults.filter(r => r.passed).length;
        console.log(`   ${type}: ${typePassed}/${typeResults.length}`);
    }

    // Show failures
    const failures = results.filter(r => !r.passed);
    if (failures.length > 0) {
        console.log('\n' + '─'.repeat(70));
        console.log('❌ FAILED QUESTIONS:\n');

        for (const fail of failures) {
            console.log(`  [${fail.id}] ${fail.type}`);
            console.log(`     Prompt: ${fail.prompt}`);

            if (fail.error) {
                console.log(`     ⚠️  Error: ${fail.error}`);
            } else {
                console.log(`     Confidence: ${fail.confidence.toFixed(2)}, Grade: ${fail.grade}`);

                if (fail.evaluation.must_include.missing.length > 0) {
                    console.log(`     Missing (must): ${fail.evaluation.must_include.missing.slice(0, 3).join(', ')}`);
                }

                const failedNumeric = fail.evaluation.numeric_checks.filter(n => !n.passed);
                if (failedNumeric.length > 0) {
                    console.log(`     Numeric fails: ${failedNumeric.map(n => `${n.label}: expected ${n.expected}, got ${n.found}`).join('; ')}`);
                }

                const failedCriteria = fail.evaluation.success_criteria.filter(c => !c.likely_met);
                if (failedCriteria.length > 0) {
                    console.log(`     Unmet criteria: ${failedCriteria.slice(0, 2).map(c => c.criteria.substring(0, 50)).join('; ')}`);
                }
            }
            console.log();
        }
    }

    // Summary
    console.log('═'.repeat(70));
    if (passRate === '100.0') {
        console.log('🎉 All tests passed!');
    } else if (parseFloat(passRate) >= 80) {
        console.log(`✅ Good pass rate: ${passRate}%`);
    } else if (parseFloat(passRate) >= 60) {
        console.log(`⚠️  Moderate pass rate: ${passRate}% - review failures`);
    } else {
        console.log(`❌ Low pass rate: ${passRate}% - significant issues detected`);
    }
    console.log('═'.repeat(70) + '\n');

    // Exit code based on pass rate
    process.exit(parseFloat(passRate) >= 60 ? 0 : 1);
}

// ============== Main ==============

async function main() {
    const questionsPath = path.join(__dirname, 'questions.json');

    if (!fs.existsSync(questionsPath)) {
        console.error('❌ questions.json not found');
        process.exit(1);
    }

    const pack: QuestionPack = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
    const tenantId = TENANT_ID || ASSISTANT_ID;

    if (!tenantId) {
        console.error('❌ TENANT_ID or ASSISTANT_ID environment variable required');
        console.error('   Usage: ASSISTANT_ID=your-id npm run test:canonical');
        process.exit(1);
    }

    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║              CANONICAL QUESTION PACK RUNNER v2                       ║');
    console.log('║              RAG Quality Regression Testing                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log(`\n   Pack: ${pack.meta.pack_name}`);
    console.log(`   Generated: ${pack.meta.generated_at_local}`);
    if (pack.meta.source_document) {
        console.log(`   Source: ${pack.meta.source_document.title.substring(0, 60)}...`);
    }

    const results = await runTests(pack, tenantId);
    printReport(results, pack);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
