"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SupportDialogProps {
  sessionToken: string
}

export function SupportButton({ sessionToken }: SupportDialogProps) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    if (!subject.trim() || !message.trim() || submitting) return
    setSubmitting(true)

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ action: "create", subject: subject.trim(), message: message.trim() }),
      })

      if (res.ok) {
        setSuccess(true)
        setSubject("")
        setMessage("")
        setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 z-30 w-12 h-12 rounded-full bg-gray-950 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-105"
        title="Contact Support"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-30 w-80">
      <Card className="shadow-xl border-gray-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Contact Support</CardTitle>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-gray-950">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="py-4 text-center">
              <p className="text-sm text-emerald-600 font-medium">Ticket submitted! We&apos;ll get back to you.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Describe your issue or question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
              />
              <Button
                size="sm"
                className="w-full"
                disabled={!subject.trim() || !message.trim() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Sending..." : "Submit Ticket"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
