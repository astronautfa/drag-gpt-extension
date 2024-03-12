import type { PositionOnScreen } from "@pages/content/src/ContentScriptApp/utils/getPositionOnScreen";
import { assign, createMachine } from "xstate";

type NodeRect = { left: number; width: number; height: number; top: number };
type RequestButtonPosition = { top: number; left: number };
type AnchorNodePosition = {
  top: number;
  bottom: number;
  center: number;
};

type TextSelectedEvent = {
  type: "TEXT_SELECTED";
  data: {
    selectedText: string;
    selectedNodeRect?: NodeRect;
    requestButtonPosition: RequestButtonPosition;
  };
};

type Events =
  | TextSelectedEvent
  | {
      type:
        | "CLOSE_MESSAGE_BOX"
        | "REQUEST_GPT"
        | "REQUEST_TRANSLATION"
        | "REQUEST_NLP"
        | "REQUEST_AUDIO"
        | "RECEIVE_END"
        | "RECEIVE_CANCEL";
    }
  | { type: "RECEIVE_ING"; data: string };

interface Context {
  chats: Chat[];
  nlp: {};
  audioTrack: ArrayBuffer | null;
  selectedText: string;
  selectedTextNodeRect: NodeRect;
  requestButtonPosition: RequestButtonPosition;
  positionOnScreen: PositionOnScreen;
  anchorNodePosition: AnchorNodePosition;
  error?: Error;
}

type Services = {
  getGPTResponse: {
    data: { firstChunk: string };
  };
  getTranslationResponse: {
    data: { firstChunk: string };
  };
  getNLPResponse: {
    data: { firstChunk: string };
  };
  getAudioResponse: {
    data: { firstChunk: string | ArrayBuffer };
  };
};

const initialContext: Context = {
  chats: [] as Chat[],
  nlp: {},
  audioTrack: null,
  selectedText: "",
  requestButtonPosition: { top: 0, left: 0 },
  anchorNodePosition: { top: 0, center: 0, bottom: 0 },
  selectedTextNodeRect: { top: 0, left: 0, height: 0, width: 0 },
  positionOnScreen: "topLeft",
  error: undefined,
} as const;

const dragStateMachine = createMachine(
  {
    id: "drag-state",
    initial: "idle",
    predictableActionArguments: true,
    context: initialContext,
    schema: {
      context: {} as Context,
      events: {} as Events,
      services: {} as Services,
    },
    tsTypes: {} as import("./dragStateMachine.typegen").Typegen0,
    states: {
      idle: {
        entry: ["resetAll"],
        on: {
          TEXT_SELECTED: {
            target: "request_button",
            actions: "readyRequestButton",
            cond: "isValidTextSelectedEvent",
          },
        },
      },
      request_button: {
        tags: "showRequestButton",
        on: {
          TEXT_SELECTED: [
            {
              actions: "readyRequestButton",
              cond: "isValidTextSelectedEvent",
            },
            {
              target: "idle",
              cond: "isInvalidTextSelectedEvent",
            },
          ],
          REQUEST_GPT: { target: "gpt_loading", actions: "addRequestChat" },
          REQUEST_TRANSLATION: { target: "translation_loading" },
          REQUEST_NLP: { target: "nlp_loading" },
          REQUEST_AUDIO: { target: "audio_loading" },
        },
      },
      audio_loading: {
        tags: "showRequestButton",
        entry: ["setAnchorNodePosition"],
        exit: ["setPositionOnScreen"],
        invoke: {
          src: "getAudioResponse",
          onDone: {
            target: "audio_response_message_box",
            actions: "addAudio",
          },
          onError: {
            target: "error_message_box",
            actions: assign({
              error: (_, event) => event.data,
            }),
          },
        },
      },
      nlp_loading: {
        tags: "showRequestButton",
        entry: ["setAnchorNodePosition"],
        exit: ["setPositionOnScreen"],
        invoke: {
          src: "getNLPResponse",
          onDone: {
            target: "nlp_response_message_box",
            actions: "addNLP",
          },
          onError: {
            target: "error_message_box",
            actions: assign({
              error: (_, event) => event.data,
            }),
          },
        },
      },
      translation_loading: {
        tags: "showRequestButton",
        entry: ["setAnchorNodePosition"],
        exit: ["setPositionOnScreen"],
        invoke: {
          src: "getTranslationResponse",
          onDone: {
            target: "temp_response_message_box",
            actions: "addInitialResponseChat",
          },
          onError: {
            target: "error_message_box",
            actions: assign({
              error: (_, event) => event.data,
            }),
          },
        },
      },
      gpt_loading: {
        tags: "showRequestButton",
        entry: ["setAnchorNodePosition"],
        exit: ["setPositionOnScreen"],
        invoke: {
          src: "getGPTResponse",
          onDone: {
            target: "temp_response_message_box",
            actions: "addInitialResponseChat",
          },
          onError: {
            target: "error_message_box",
            actions: assign({
              error: (_, event) => event.data,
            }),
          },
        },
      },
      temp_response_message_box: {
        on: {
          RECEIVE_ING: {
            actions: "addResponseChatChunk",
          },
          RECEIVE_END: "response_message_box",
          RECEIVE_CANCEL: "idle",
        },
      },
      response_message_box: {
        tags: "showResponseMessages",
        on: {
          CLOSE_MESSAGE_BOX: "idle",
        },
      },
      nlp_response_message_box: {
        tags: "showNLPResponseMessages",
        on: {
          CLOSE_MESSAGE_BOX: "idle",
        },
      },
      error_message_box: {
        on: {
          CLOSE_MESSAGE_BOX: "idle",
        },
      },
      audio_response_message_box: {
        tags: "showAudioResponseMessages",
        on: {
          CLOSE_MESSAGE_BOX: "idle",
        },
      },
    },
  },
  {
    actions: {
      resetAll: assign({ ...initialContext }),
      setAnchorNodePosition: assign({
        anchorNodePosition: (context) => {
          const { left, width, height, top } = context.selectedTextNodeRect;
          const verticalCenter = left + width / 2;
          return {
            top: top + window.scrollY,
            bottom: top + height + window.scrollY,
            center: verticalCenter + window.scrollX,
          };
        },
      }),
      readyRequestButton: assign({
        selectedText: (_, event) => event.data.selectedText,
        selectedTextNodeRect: (context, event) =>
          event.data.selectedNodeRect ?? context.selectedTextNodeRect,
        requestButtonPosition: (_, event) => event.data.requestButtonPosition,
      }),
      addRequestChat: assign({
        chats: (context) =>
          context.chats.concat({ role: "user", content: context.selectedText }),
      }),
      addInitialResponseChat: assign({
        chats: (context, event) =>
          context.chats.concat({
            role: "assistant",
            content: event.data.firstChunk,
          }),
      }),
      addNLP: assign({
        nlp: (context, event) => (context.nlp = event.data.firstChunk),
      }),
      addAudio: assign({
        audioTrack: (context, event) =>
          (context.audioTrack =
            typeof event.data.firstChunk === "string"
              ? null
              : event.data.firstChunk),
      }),
      addResponseChatChunk: assign({
        chats: ({ chats }, event) => {
          const lastChat = chats.at(-1);
          if (!lastChat) {
            return chats;
          }
          return chats
            .slice(0, chats.length - 1)
            .concat({ ...lastChat, content: lastChat.content + event.data });
        },
      }),
    },
    guards: {
      isValidTextSelectedEvent: (_, event) => {
        return isValidTextSelectedEvent(event);
      },
      isInvalidTextSelectedEvent: (_, event) => {
        return !isValidTextSelectedEvent(event);
      },
    },
  }
);

function isValidTextSelectedEvent(event: TextSelectedEvent): boolean {
  if (!event.data.selectedNodeRect) {
    return false;
  }
  return event.data.selectedText.length > 1;
}

export default dragStateMachine;
