import React from "react";

type Props = {
  email: string;
  setEmail: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
};

export default function EmailUsernameInputs({ email, setEmail, username, setUsername }: Props) {
  return (
    <>
      <input
        className="input w-full"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="input w-full"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
    </>
  );
}
