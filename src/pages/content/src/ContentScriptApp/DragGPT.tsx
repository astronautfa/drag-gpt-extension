import { useEffect, useState, useRef } from "react";
import {
  getSelectionNodeRect,
  getSelectionText,
} from "@pages/content/src/ContentScriptApp/utils/selection";
import GPTRequestButton from "@pages/content/src/ContentScriptApp/components/GPTRequestButton";
import ResponseMessageBox from "@pages/content/src/ContentScriptApp/components/messageBox/ResponseMessageBox";
import ErrorMessageBox from "@pages/content/src/ContentScriptApp/components/messageBox/ErrorMessageBox";
import { useMachine } from "@xstate/react";
import delayPromise from "@pages/content/src/ContentScriptApp/utils/delayPromise";
import dragStateMachine from "@pages/content/src/ContentScriptApp/xState/dragStateMachine";
import { sendMessageToBackground } from "@src/chrome/message";
import styled from "@emotion/styled";
import { getPositionOnScreen } from "@pages/content/src/ContentScriptApp/utils/getPositionOnScreen";
import useSelectedSlot from "@pages/content/src/ContentScriptApp/hooks/useSelectedSlot";
import ChatText from "@src/shared/component/ChatText";
import AssistantChat from "@src/shared/component/AssistantChat";
import MessageBox from "@pages/content/src/ContentScriptApp/components/messageBox/MessageBox";
import { t } from "@src/chrome/i18n";
import GoogleTranslateRequestButton from "./components/GoogleTranslateRequestButton";
import NLPRequestButton from "./components/NLPRequestButton";
import NLPMessageBox from "./components/messageBox/NLPMessageBox";
import AudioRequestButton from "./components/AudioRequestButton";

const Container = styled.div`
  * {
    font-family: "Noto Sans KR", sans-serif;
  }
`;

const skipLoopCycleOnce = async () => await delayPromise(1);

async function getGPTResponseAsStream({
  input,
  onDelta,
  onFinish,
}: {
  input: string;
  onDelta: (chunk: string) => unknown;
  onFinish: (result: string) => unknown;
}) {
  return new Promise<{ firstChunk: string }>((resolve, reject) => {
    sendMessageToBackground({
      message: {
        type: "RequestInitialDragGPTStream",
        input,
      },
      handleSuccess: (response) => {
        if (response.isDone || !response.chunk) {
          return onFinish(response.result);
        }
        resolve({ firstChunk: response.chunk });
        onDelta(response.chunk);
      },
      handleError: reject,
    });
  });
}

async function getGoogleTranslate({
  input,
  onFinish,
}: {
  input: string;
  onFinish: (result: string) => unknown;
}) {
  return new Promise<{ firstChunk: string }>((resolve, reject) => {
    sendMessageToBackground({
      message: {
        type: "RequestTranslation",
        input,
      },
      handleSuccess: (response) => {
        if (response.isDone) {
          resolve({ firstChunk: response.result });
          return onFinish(response.result);
        }
      },
      handleError: reject,
    });
  });
}

async function getNLP({
  input,
  onFinish,
}: {
  input: string;
  onFinish: (result: string) => unknown;
}) {
  return new Promise<{ firstChunk: string }>((resolve, reject) => {
    sendMessageToBackground({
      message: {
        type: "RequestNLP",
        input,
      },
      handleSuccess: (response) => {
        if (response.isDone) {
          resolve({ firstChunk: response.result });
          return onFinish(response.result);
        }
      },
      handleError: reject,
    });
  });
}

async function getAudio({
  input,
  onFinish,
}: {
  input: string;
  onFinish: (result: ArrayBuffer | string) => unknown;
}) {
  return new Promise<{ firstChunk: string | ArrayBuffer }>(
    (resolve, reject) => {
      sendMessageToBackground({
        message: {
          type: "RequestAudio",
          input,
        },
        handleSuccess: (response) => {
          if (response.isDone) {
            resolve({ firstChunk: response.result });
            return onFinish(response.result);
          }
        },
        handleError: reject,
      });
    }
  );
}

export default function DragGPT() {
  const selectedSlot = useSelectedSlot();
  const [state, send] = useMachine(dragStateMachine, {
    actions: {
      setPositionOnScreen: (context) => {
        const { left, width, height, top } = context.selectedTextNodeRect;
        const verticalCenter = left + width / 2;
        const horizontalCenter = top + height / 2;
        context.positionOnScreen = getPositionOnScreen({
          horizontalCenter,
          verticalCenter,
        });
      },
    },
    services: {
      getGPTResponse: (
        context
      ): Promise<{
        firstChunk: string;
      }> => {
        return getGPTResponseAsStream({
          input: context.selectedText,
          onDelta: (chunk) => send("RECEIVE_ING", { data: chunk }),
          onFinish: () => send("RECEIVE_END"),
        });
      },
      getTranslationResponse: (context) => {
        return getGoogleTranslate({
          input: context.selectedText,
          onFinish: () => send("RECEIVE_END"),
        });
      },
      getNLPResponse: (context) => {
        return getNLP({
          input: context.selectedText,
          onFinish: () => send("RECEIVE_END"),
        });
      },
      getAudioResponse: (context) => {
        return getAudio({
          input: context.selectedText,
          onFinish: async (result) => {
            console.log(context)
            console.log(result)
            if (context.audioTrack) {
              const arrayBuffer = context.audioTrack;
              const blob = new Blob([arrayBuffer], {
                type: "audio/mpeg",
              });
              const blobUrl = URL.createObjectURL(blob);
              console.log(blobUrl);
              setAudio(blobUrl);
            }
          },
        });
      },
    },
  });

  const [audio, setAudio] = useState("");
  const audioRef = useRef<any>(null);

  useEffect(() => {
    if (audio && audioRef.current) {
      audioRef.current.play();
    }
  }, [audio]);

  useEffect(() => {
    const onMouseUp = async (event: MouseEvent) => {
      /** Selection 이벤트 호출을 기다리는 해키한 코드 */
      await skipLoopCycleOnce();
      send({
        type: "TEXT_SELECTED",
        data: {
          selectedText: getSelectionText(),
          selectedNodeRect: getSelectionNodeRect(),
          requestButtonPosition: {
            top: event.clientY + window.scrollY,
            left: event.clientX + window.scrollX,
          },
        },
      });
    };

    window.document.addEventListener("mouseup", onMouseUp);
    return () => {
      window.document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const requestGPT = () => {
    send("REQUEST_GPT");
  };

  const requestTranslation = () => {
    send("REQUEST_TRANSLATION");
  };

  const requestNLP = () => {
    send("REQUEST_NLP");
  };

  const requestAudio = () => {
    send("REQUEST_AUDIO");
  };

  const closeMessageBox = () => {
    send("CLOSE_MESSAGE_BOX");
  };

  return (
    <Container>
      {state.hasTag("showRequestButton") && (
        <GPTRequestButton
          onClick={requestGPT}
          loading={state.matches("gpt_loading")}
          top={state.context.requestButtonPosition.top}
          left={state.context.requestButtonPosition.left}
          selectedSlot={selectedSlot}
        />
      )}
      {state.hasTag("showRequestButton") && (
        <GoogleTranslateRequestButton
          onClick={requestTranslation}
          loading={state.matches("translation_loading")}
          top={state.context.requestButtonPosition.top}
          left={state.context.requestButtonPosition.left + 30}
        />
      )}
      {state.hasTag("showRequestButton") && (
        <NLPRequestButton
          onClick={requestNLP}
          loading={state.matches("nlp_loading")}
          top={state.context.requestButtonPosition.top}
          left={state.context.requestButtonPosition.left + 60}
        />
      )}
      {state.hasTag("showRequestButton") && (
        <AudioRequestButton
          onClick={requestAudio}
          loading={state.matches("nlp_loading")}
          top={state.context.requestButtonPosition.top}
          left={state.context.requestButtonPosition.left + 90}
        />
      )}
      {state.matches("temp_response_message_box") && (
        <MessageBox
          header={t("responseMessageBox_responseTitle")}
          content={
            <AssistantChat>
              <ChatText>{state.context.chats.at(-1)?.content}</ChatText>
            </AssistantChat>
          }
          width={480}
          isOutsideClickDisabled={true}
          onClose={() => send("RECEIVE_CANCEL")}
          anchorTop={state.context.anchorNodePosition.top}
          anchorCenter={state.context.anchorNodePosition.center}
          anchorBottom={state.context.anchorNodePosition.bottom}
          positionOnScreen={state.context.positionOnScreen}
        />
      )}
      {state.hasTag("showResponseMessages") && (
        <ResponseMessageBox
          onClose={closeMessageBox}
          initialChats={state.context.chats}
          anchorTop={state.context.anchorNodePosition.top}
          anchorCenter={state.context.anchorNodePosition.center}
          anchorBottom={state.context.anchorNodePosition.bottom}
          positionOnScreen={state.context.positionOnScreen}
        />
      )}
      {state.hasTag("showNLPResponseMessages") && (
        <NLPMessageBox
          onClose={closeMessageBox}
          nlp={state.context.nlp}
          anchorTop={state.context.anchorNodePosition.top}
          anchorCenter={state.context.anchorNodePosition.center}
          anchorBottom={state.context.anchorNodePosition.bottom}
          positionOnScreen={state.context.positionOnScreen}
          header={undefined}
          content={undefined}
          width={0}
        />
      )}
      {state.hasTag("showAudioResponseMessages") && audio && (
        <div className="bg-white fixed top-10 right-10 p-20">
          <audio ref={audioRef} controls src={`${audio}`} className="w-full" />
        </div>
      )}
      {state.matches("error_message_box") && (
        <ErrorMessageBox
          onClose={closeMessageBox}
          error={state.context.error}
          anchorTop={state.context.anchorNodePosition.top}
          anchorCenter={state.context.anchorNodePosition.center}
          anchorBottom={state.context.anchorNodePosition.bottom}
          positionOnScreen={state.context.positionOnScreen}
        />
      )}
    </Container>
  );
}
