import fs from "fs";
import path from "path";

const loadRequirements = () => {
  const filePath = path.join(process.cwd(), "requirements.md");
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    return "requirements.md not found.";
  }
};

export default function RequirementsPage() {
  const content = loadRequirements();

  return (
    <main className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#66fcf1]">
            Reference
          </p>
          <h1 className="text-3xl font-bold text-white">Requirements</h1>
          <p className="text-sm text-gray-300">
            Sourced from the repository root `requirements.md` so updates stay
            in sync.
          </p>
        </header>

        <pre className="whitespace-pre-wrap rounded-lg border border-[#45a29e]/50 bg-[#12161e] p-4 text-sm leading-relaxed text-gray-200 shadow">
          {content}
        </pre>
      </div>
    </main>
  );
}

