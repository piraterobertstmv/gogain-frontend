import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";
import { User } from "../types/User";
import { Transaction } from "../types/Transaction";

interface PdfTransactionImporterProps {
  closePopupFunc: () => void;
  user: User;
  onSuccess: () => void;
}

export function PdfTransactionImporter({ closePopupFunc, user, onSuccess }: PdfTransactionImporterProps) {
  const [pdfText, setPdfText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_KEY}transaction/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ pdfText }),
      });

      if (!response.ok) {
        throw new Error("Failed to import transactions");
      }

      onSuccess();
      closePopupFunc();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Import Transactions from PDF</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste PDF Text
            </label>
            <Textarea
              value={pdfText}
              onChange={(e) => setPdfText(e.target.value)}
              placeholder="Paste the text content from your PDF here..."
              rows={10}
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={closePopupFunc}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !pdfText.trim()}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? "Importing..." : "Import"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 