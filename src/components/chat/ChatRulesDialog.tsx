"use client";
import { Button, Modal, Notice } from "@/components/ui";

/** Community rules. With `requireAccept`, the member must agree before they can post. */
export function ChatRulesDialog({
  isOpen,
  requireAccept,
  saving,
  error,
  onAccept,
  onClose,
}: {
  isOpen: boolean;
  requireAccept: boolean;
  saving: boolean;
  error: string;
  onAccept: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Community rules"
      footer={
        requireAccept ? (
          <>
            <Button variant="secondary" className="min-h-11" onClick={onClose}>
              Not now
            </Button>
            <Button className="min-h-11" isLoading={saving} onClick={onAccept}>
              I agree to these rules
            </Button>
          </>
        ) : (
          <Button className="min-h-11" onClick={onClose}>
            Got it
          </Button>
        )
      }
    >
      {requireAccept && (
        <p className="mb-3 text-text-muted">Please read and accept the rules before you post.</p>
      )}
      {error && requireAccept && <Notice tone="danger">{error}</Notice>}
      <ol className="list-decimal space-y-3 pl-5">
        <li>Share work and give constructive feedback.</li>
        <li>Respect people. Disagree with ideas, not identities.</li>
        <li>No spam or unsolicited promotions.</li>
        <li>Admins can remove inappropriate messages.</li>
      </ol>
    </Modal>
  );
}
