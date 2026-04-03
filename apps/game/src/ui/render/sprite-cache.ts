type SpriteCacheEntry =
  | {
      status: "loading";
      image: HTMLImageElement;
    }
  | {
      status: "loaded";
      image: HTMLImageElement;
    }
  | {
      status: "error";
      image: null;
    };

const spriteCache = new Map<string, SpriteCacheEntry>();

export function readCachedSprite(
  url: string | null,
  onInvalidate: () => void,
): HTMLImageElement | null {
  if (!url) {
    return null;
  }

  const cached = spriteCache.get(url);

  if (cached?.status === "loaded") {
    return cached.image;
  }

  if (cached?.status === "error") {
    return null;
  }

  if (!cached) {
    const image = new Image();
    image.crossOrigin = "anonymous";

    spriteCache.set(url, {
      status: "loading",
      image,
    });

    image.onload = () => {
      spriteCache.set(url, {
        status: "loaded",
        image,
      });
      onInvalidate();
    };

    image.onerror = () => {
      spriteCache.set(url, {
        status: "error",
        image: null,
      });
      onInvalidate();
    };

    image.src = url;
  }

  return null;
}
