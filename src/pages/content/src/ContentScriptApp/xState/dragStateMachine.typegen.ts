
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.drag-state.audio_loading:invocation[0]": { type: "done.invoke.drag-state.audio_loading:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.drag-state.gpt_loading:invocation[0]": { type: "done.invoke.drag-state.gpt_loading:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.drag-state.nlp_loading:invocation[0]": { type: "done.invoke.drag-state.nlp_loading:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.drag-state.translation_loading:invocation[0]": { type: "done.invoke.drag-state.translation_loading:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.drag-state.audio_loading:invocation[0]": { type: "error.platform.drag-state.audio_loading:invocation[0]"; data: unknown };
"error.platform.drag-state.gpt_loading:invocation[0]": { type: "error.platform.drag-state.gpt_loading:invocation[0]"; data: unknown };
"error.platform.drag-state.nlp_loading:invocation[0]": { type: "error.platform.drag-state.nlp_loading:invocation[0]"; data: unknown };
"error.platform.drag-state.translation_loading:invocation[0]": { type: "error.platform.drag-state.translation_loading:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
"xstate.stop": { type: "xstate.stop" };
        };
        invokeSrcNameMap: {
          "getAudioResponse": "done.invoke.drag-state.audio_loading:invocation[0]";
"getGPTResponse": "done.invoke.drag-state.gpt_loading:invocation[0]";
"getNLPResponse": "done.invoke.drag-state.nlp_loading:invocation[0]";
"getTranslationResponse": "done.invoke.drag-state.translation_loading:invocation[0]";
        };
        missingImplementations: {
          actions: "setPositionOnScreen";
          delays: never;
          guards: never;
          services: "getAudioResponse" | "getGPTResponse" | "getNLPResponse" | "getTranslationResponse";
        };
        eventsCausingActions: {
          "addAudio": "done.invoke.drag-state.audio_loading:invocation[0]";
"addInitialResponseChat": "done.invoke.drag-state.gpt_loading:invocation[0]" | "done.invoke.drag-state.translation_loading:invocation[0]";
"addNLP": "done.invoke.drag-state.nlp_loading:invocation[0]";
"addRequestChat": "REQUEST_GPT";
"addResponseChatChunk": "RECEIVE_ING";
"readyRequestButton": "TEXT_SELECTED";
"resetAll": "CLOSE_MESSAGE_BOX" | "RECEIVE_CANCEL" | "TEXT_SELECTED" | "xstate.init";
"setAnchorNodePosition": "REQUEST_AUDIO" | "REQUEST_GPT" | "REQUEST_NLP" | "REQUEST_TRANSLATION";
"setPositionOnScreen": "done.invoke.drag-state.audio_loading:invocation[0]" | "done.invoke.drag-state.gpt_loading:invocation[0]" | "done.invoke.drag-state.nlp_loading:invocation[0]" | "done.invoke.drag-state.translation_loading:invocation[0]" | "error.platform.drag-state.audio_loading:invocation[0]" | "error.platform.drag-state.gpt_loading:invocation[0]" | "error.platform.drag-state.nlp_loading:invocation[0]" | "error.platform.drag-state.translation_loading:invocation[0]" | "xstate.stop";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "isInvalidTextSelectedEvent": "TEXT_SELECTED";
"isValidTextSelectedEvent": "TEXT_SELECTED";
        };
        eventsCausingServices: {
          "getAudioResponse": "REQUEST_AUDIO";
"getGPTResponse": "REQUEST_GPT";
"getNLPResponse": "REQUEST_NLP";
"getTranslationResponse": "REQUEST_TRANSLATION";
        };
        matchesStates: "audio_loading" | "audio_response_message_box" | "error_message_box" | "gpt_loading" | "idle" | "nlp_loading" | "nlp_response_message_box" | "request_button" | "response_message_box" | "temp_response_message_box" | "translation_loading";
        tags: "showAudioResponseMessages" | "showNLPResponseMessages" | "showRequestButton" | "showResponseMessages";
      }
  