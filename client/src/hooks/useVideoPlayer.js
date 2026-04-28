import { useRef } from "react";

export default function useVideoPlayer() {
  const videoRef = useRef(null);

  const seekTo = (timestamp) => {
    if (videoRef.current) {
      const video = videoRef.current;
      const time = parseFloat(timestamp);

      const performSeek = () => {
        video.currentTime = time;
        video.play().catch((err) => console.log("Play failed:", err));
      };

      if (video.readyState >= 1) {
        performSeek();
      } else {
        const onLoadedMetadata = () => {
          performSeek();
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
        };
        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.load();
      }
    }
  };

  const syncTranscriptToVideo = (transcript) => {
    if (!videoRef.current || !transcript) return;
    const currentTime = videoRef.current.currentTime;

    let targetIndex = 0;
    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i].start <= currentTime) {
        targetIndex = i;
      } else {
        break;
      }
    }

    const element = document.getElementById(`transcript-row-${targetIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return { videoRef, seekTo, syncTranscriptToVideo };
}
