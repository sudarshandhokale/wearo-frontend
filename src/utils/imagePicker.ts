import * as ImagePicker from "expo-image-picker";

import type { PickedImage } from "../api/AppService";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function pickWardrobeImage(source: "camera" | "gallery"): Promise<PickedImage | null> {
  const images = await pickWardrobeImages(source, false);
  return images[0] || null;
}

export async function pickWardrobeImages(source: "camera" | "gallery", multiple = source === "gallery"): Promise<PickedImage[]> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error("Camera access is required to take a clothing photo.");
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error("Photo library access is required to choose a clothing photo.");
  }

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({
          allowsMultipleSelection: multiple,
          mediaTypes: ["images"],
          quality: 0.9,
          selectionLimit: multiple ? 10 : 1
        });

  if (result.canceled) return [];

  return result.assets.map((asset, index) => {
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      throw new Error("Choose JPEG, PNG, or WebP images smaller than 10 MB each.");
    }

    const mimeType = asset.mimeType || mimeTypeFromName(asset.fileName || asset.uri);
    if (!/[\/]((jpeg)|(png)|(webp))$/i.test(mimeType)) {
      throw new Error("Choose JPEG, PNG, or WebP images.");
    }

    return {
      uri: asset.uri,
      name: asset.fileName || `wearo-item-${Date.now()}-${index + 1}.${extensionFor(mimeType)}`,
      mimeType
    };
  });
}

function mimeTypeFromName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

function extensionFor(mimeType: string) {
  if (mimeType.endsWith("png")) return "png";
  if (mimeType.endsWith("webp")) return "webp";
  return "jpg";
}
