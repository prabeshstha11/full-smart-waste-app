export const uploadToCloudinary = async (photoUri: string): Promise<string> => {
  const data = new FormData();

  // Your Cloudinary credentials
  const CLOUD_NAME = "dl25bnqfx";
  const API_KEY = "624466788243591";

  data.append("file", {
    uri: photoUri,
    type: "image/jpeg",
    name: "upload.jpg",
  } as any);
  data.append("api_key", API_KEY);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: data,
    });

    const json = await res.json();

    if (json.secure_url) {
      console.log("Cloudinary URL:", json.secure_url);
      return json.secure_url;
    } else {
      console.error("Upload failed", json);
      throw new Error("Upload failed");
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary", error);
    throw error;
  }
}; 