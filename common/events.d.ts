interface SkipToSectionEvent {
    section: SectionName;
}

interface SectionStartedEvent {
    section: SectionName;
}

interface SetGoalsEvent {
    goals: Goal[];
}

interface DialogReceivedEvent {
    DialogText: string;
    DialogEntIndex: EntityIndex;
    DialogAdvanceTime: number;
    Token: DialogToken;
}

interface DialogClearEvent {
    Token?: DialogToken;
}

interface DialogCompleteEvent {
    Token: DialogToken;
}

interface DetectModifierKeyEvent {
    key: ModifierKey;
}

interface ModifierKeyDetectedEvent {
    key: ModifierKey;
}

interface ClockTimeEvent {
    seconds: number;
    minutes?: number;
}

interface HighlightElementEvent {
    path: string;
    duration?: number;
}

interface RemoveHighlightEvent {
    path: string;
}

interface ChatWheelPhraseSelectedEvent {
    phraseIndex: number;
}

interface ShopOpenChangedEvent {
    open: boolean;
}

interface PlayVideoEvent {
    name: VideoName;
}

interface CustomGameEventDeclarations {
    section_started: SectionStartedEvent;
    skip_to_section: SkipToSectionEvent;
    dialog_complete: DialogCompleteEvent;
    dialog: DialogReceivedEvent;
    dialog_clear: DialogClearEvent;
    ui_loaded: {};
    detect_camera_movement: {};
    camera_movement_detected: {};
    set_goals: SetGoalsEvent;
    detect_modifier_key: DetectModifierKeyEvent;
    modifier_key_detected: ModifierKeyDetectedEvent;
    set_client_clock: ClockTimeEvent;
    highlight_element: HighlightElementEvent;
    remove_highlight: RemoveHighlightEvent;
    chat_wheel_phrase_selected: ChatWheelPhraseSelectedEvent;
    shop_open_changed: ShopOpenChangedEvent;
    play_video: PlayVideoEvent;
    hide_video: {};
    play_video_continue: {};
    fade_screen: {};
    voice_chat: {};
}
