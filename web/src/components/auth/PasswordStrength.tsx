import React from "react";

type PwInfo = { score: number; label: string; suggestions: string[] } | null;

type Props = {
  pwInfo: PwInfo;
};

export default function PasswordStrength({ pwInfo }: Props) {
  if (!pwInfo) return null;
  return (
    <div className="mt-2">
      <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
        <div
          style={{ width: `${(pwInfo.score / 4) * 100}%` }}
          className={`h-full ${pwInfo.score >= 4 ? "bg-green-500" : pwInfo.score === 3 ? "bg-yellow-400" : "bg-red-500"}`}
        />
      </div>
      <div className="flex items-center justify-between text-xs mt-1">
        <span className="font-medium">{pwInfo.label}</span>
        <span className="text-muted">{pwInfo.score}/4</span>
      </div>
    </div>
  );
}
