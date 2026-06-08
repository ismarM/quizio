type UploadedImageResponse = {
  url: string;
};

export function isImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("data:image/")) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export async function uploadImageFile(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Image upload failed");
  }

  return response.json() as Promise<UploadedImageResponse>;
}
