// Tenant Persona & Configuration types (Phase 2)

/** Assistant behavior mode */
export type AssistantType = 'reactive' | 'guided' | 'reference';

/** Per-tenant persona definition controlling AI voice and behavior */
export interface TenantPersona {
    name?: string;
    tone?: string;
    voice?: string;
    boundaries?: string;
    customInstructions?: string;
}

/** A starter question chip shown in the widget */
export interface StarterQuestion {
    /** Display text shown on the chip */
    label: string;
    /** Message sent when clicked (can differ from label) */
    message: string;
}

/** Payload returned to the widget on bootstrap */
export interface WidgetBootstrap {
    tenantName: string;
    welcomeMessage: string;
    starterQuestions: StarterQuestion[];
    assistantType: AssistantType;
    persona: { name?: string };
    config: {
        primaryColor?: string;
        widgetTitle?: string;
    };
}
