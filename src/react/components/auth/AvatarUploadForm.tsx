import { useId, useState } from "react";
import { z } from "zod";
import type { $ZodIssue as ZodIssue } from "zod/v4/core";
import { FormError, hasError } from "../FormError";
import Avatar from "./Avatar";
import { useMe } from "./MeContext";

const AvatarUploadFormSchema = z.object({
  avatar: z
    .file()
    .min(1, "Image is required")
    .max(2_000_000, "Image is too heavy")
    .mime(
      ["image/jpeg", "image/png", "image/webp", "image/gif"],
      "Invalid file type",
    ),
});

function AvatarUploadForm() {
  const { user, updateMeAvatar } = useMe();
  const fileInputId = useId();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<ZodIssue[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = AvatarUploadFormSchema.safeParse({
      avatar: e.target.files?.[0],
    });

    if (!parsed.success) {
      setErrors(parsed.error.issues);
      return;
    }

    setErrors([]);
    setSelectedFile(parsed.data.avatar);

    const objectUrl = URL.createObjectURL(parsed.data.avatar);
    setPreviewUrl(objectUrl);
  };

  const handleUploadAction = async () => {
    await updateMeAvatar(selectedFile);

    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleDeleteAction = async () => {
    await updateMeAvatar(null);

    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const currentAvatarUrl = previewUrl ?? user?.avatar_url;

  return (
    <form
      aria-label="avatar upload form"
      action={handleUploadAction}
      className="avatar-upload-container"
    >
      <h2>Avatar</h2>

      <FormError
        issues={errors}
        name="avatar"
        id={`${fileInputId}-error`}
        aria-invalid={hasError(errors, "avatar")}
      />

      <div style={{ display: "flex", flexDirection: "row", gap: "2rem" }}>
        <fieldset>
          <Avatar
            url={currentAvatarUrl}
            name={user?.name}
            size="3rlh"
            style={{ marginBottom: "1rem" }}
          />

          <button
            type="submit"
            formAction={handleDeleteAction}
            disabled={!user?.avatar_url || selectedFile != null}
            className="outline contrast"
          >
            Remove Avatar
          </button>
        </fieldset>

        <fieldset>
          <label htmlFor={fileInputId}>Choose a new image</label>
          <input
            id={fileInputId}
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
          />

          <button type="submit" disabled={!selectedFile}>
            Save Avatar
          </button>
        </fieldset>
      </div>
    </form>
  );
}

export default AvatarUploadForm;
