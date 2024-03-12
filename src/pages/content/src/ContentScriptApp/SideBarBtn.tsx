import { sendMessageToBackground } from "@src/chrome/message";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

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

const SideBarBtn = () => {
  const [isActive, setIsActive] = useState<boolean>(false);
  // const [paragraphs, setParagraphs] = useState<
  //   NodeListOf<HTMLParagraphElement>
  // >(document.querySelectorAll("p"));

  useEffect(() => {
    if (isActive) {

      const paragraphs = document.querySelectorAll("p")
      console.log(paragraphs[4].innerText);
      getGoogleTranslate({
        input: paragraphs[4].innerText,
        onFinish: (result) =>
          ReactDOM.render(
            <TranslationBox
              text={paragraphs[4].innerText}
              translation={result}
            />,
            paragraphs[4]
          ),
      });

      getGoogleTranslate({
        input: paragraphs[5].innerText,
        onFinish: (result) =>
          ReactDOM.render(
            <TranslationBox
              text={paragraphs[5].innerText}
              translation={result}
            />,
            paragraphs[5]
          ),
      });

      // p.forEach((paragraph: HTMLElement, index: number) => {
      //   getGoogleTranslate({
      //     input: paragraph.innerText,
      //     onFinish: (result) =>
      //       ReactDOM.render(
      //         <TranslationBox
      //           text={paragraph.innerText}
      //           translation={result}
      //         />,
      //         paragraph
      //       ),
      //   });
      // });
    }
  }, [isActive]);

  return (
    <div
      style={{
        position: "fixed",
        top: "250px",
        right: "10px",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => {
        setIsActive((prev) => !prev);
        console.log("clicked");
      }}
    >
      {isActive ? "Translation" : "Normal"}
    </div>
  );
};

const TranslationBox = ({
  text,
  translation,
}: {
  text: string;
  translation: string;
}) => {
  return (
    <React.Fragment data-translation={translation} data-original={text}>
      {text}
      <p className=" text-blue-400 bg-red-500">{translation}</p>
    </React.Fragment>
  );
};

export default SideBarBtn;
