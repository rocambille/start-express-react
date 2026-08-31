import type { CSSProperties } from "react";

type AvatarProps = {
  url?: string | null;
  name?: string | null;
  size?: string;
  style?: CSSProperties;
};

function Avatar({ url, name, size = "3rlh", style }: AvatarProps) {
  const customStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    ...style,
  };

  if (url) {
    return (
      <img
        src={url}
        alt={`${name}'s avatar`}
        style={{
          ...customStyle,
          objectFit: "cover",
          border: "2px solid #ccc",
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...customStyle,
        backgroundColor: "#e0e0e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#666",
        fontSize: "1.2rem",
        fontWeight: "bold",
      }}
    >
      {name ? name.charAt(0).toUpperCase() : "?"}
    </div>
  );
}

export default Avatar;
