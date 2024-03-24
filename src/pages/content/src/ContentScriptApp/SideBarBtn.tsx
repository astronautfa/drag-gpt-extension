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

async function getDeepLTranslate({
  input,
  onFinish,
}: {
  input: string;
  onFinish: (result: {
    translated_text: string;
    translated_sentences: string[];
    original_sentences: string[];
  }) => unknown;
}) {
  return new Promise<{
    firstChunk: {
      translated_text: string;
      translated_sentences: string[];
      original_sentences: string[];
    };
  }>((resolve, reject) => {
    sendMessageToBackground({
      message: {
        type: "RequestDeepLTranslation",
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
      const paragraphs = document.querySelectorAll("p");

      // getGoogleTranslate({
      //   input: paragraphs[4].innerText,
      //   onFinish: (result) =>
      //     ReactDOM.render(
      //       <TranslationBox
      //         text={paragraphs[4].innerText}
      //         translation={result}
      //       />,
      //       paragraphs[4]
      //     ),
      // });

      getDeepLTranslate({
        input: paragraphs[8].innerText,
        onFinish: (result) =>
          ReactDOM.render(
            <TranslationBox
              text={paragraphs[8].innerText}
              translation={result?.translated_text}
              original_sentences={result.original_sentences}
              translated_senteces={result.translated_sentences}
            />,
            paragraphs[8]
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
  original_sentences,
  translated_senteces,
}: {
  text: string;
  translation: string;
  original_sentences: string[];
  translated_senteces: string[];
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>();

  return (
    <React.Fragment data-translation={translation} data-original={text}>
      {original_sentences.map((os, index) => (
        <span
          key={index}
          onMouseLeave={() => setHoveredIndex(null)}
          onMouseEnter={() => setHoveredIndex(index)}
          style={hoveredIndex === index ? { backgroundColor: "gray" } : {}}
        >
          {os}
        </span>
      ))}
      <p
        className="text-blue-400 bg-red-500"
        // style={{ color: "red", backgroundColor: "white" }}
      >
        {translated_senteces.map((ts, index) => (
          <span
            key={index}
            onMouseLeave={() => setHoveredIndex(null)}
            onMouseEnter={() => setHoveredIndex(index)}
            style={hoveredIndex === index ? { backgroundColor: "gray" } : {}}
          >
            {ts}
          </span>
        ))}
      </p>
    </React.Fragment>
  );
};

export default SideBarBtn;
