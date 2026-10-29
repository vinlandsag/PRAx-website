"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Toggle,
  Badge,
  StatusBadge,
  statuses,
  CategoryTag,
  Avatar,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  TaskCard,
  Tabs,
  SegmentedControl,
  SidebarNavItem,
  Breadcrumb,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  StatusCell,
  ActionCell,
  TableEmptyState,
  FileUpload,
  Notice,
  ErrorMessage,
  Toast,
  Skeleton,
  EmptyState,
  Dialog,
  Progress,
  Icon,
  type IconName,
} from "@/components/ui";

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-1">
        <h2 className="text-sm font-bold tracking-tight">{title}</h2>
        {description && <p className="text-[11px] text-text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}
function Specimen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Card className={`p-4 ${className}`}>{children}</Card>;
}
const swatches = [
  ["Workspace", "background", "#F7F6F3"],
  ["Sidebar", "sidebar", "#151B29"],
  ["Surface", "surface", "#FFFFFF"],
  ["Primary", "primary", "#6056E8"],
  ["Selected nav", "sidebar-active", "#4B49A5"],
  ["Border", "border", "#E7E6E3"],
  ["Success", "success-bg", "#E2F6ED"],
  ["Pending", "warning-bg", "#FFF2DF"],
  ["Rejected", "danger-bg", "#FFEDEB"],
  ["Neutral", "border-subtle", "#EFEEED"],
];
const sections = [
  "Foundations",
  "Actions",
  "Forms",
  "Identity",
  "Navigation",
  "Panels",
  "Tables",
  "Upload",
  "Feedback",
  "Dialog",
];
export default function DesignSystemReview() {
  const [fontStatus, setFontStatus] = useState("Checking Inter…");
  const [tab, setTab] = useState("all");
  const [underline, setUnderline] = useState("proof");
  const [period, setPeriod] = useState("weekly");
  const [dialog, setDialog] = useState(false);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all(
      [400, 500, 600, 700, 800].map((weight) => document.fonts.load(`${weight} 12px Inter`))
    )
      .then((faces) => {
        if (active)
          setFontStatus(
            faces.every((face) => face.some((font) => font.status === "loaded"))
              ? "Inter loaded · 400 / 500 / 600 / 700 / 800"
              : "Inter failed to load — check font request"
          );
      })
      .catch(() => {
        if (active) setFontStatus("Inter failed to load — check font request");
      });
    return () => {
      active = false;
    };
  }, []);
  const save = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    setSaving(false);
    setToast("Changes saved in this local example.");
  };
  return (
    <main className="mx-auto flex w-full max-w-[1132px] min-w-0 flex-col gap-7 px-(--layout-page-padding) py-7 text-xs leading-(--leading-body) max-sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-brand-accent text-sm font-extrabold text-white">
            P
          </span>
          <span className="text-base font-extrabold tracking-tight">PRAX</span>
          <span className="ml-2 text-[10px] font-semibold tracking-widest text-text-muted uppercase">
            UI foundation
          </span>
        </div>
        <Badge size="sm" variant="neutral">
          Development only
        </Badge>
      </div>
      <div>
        <h1 className="text-[length:var(--text-heading)] leading-tight font-bold tracking-(--tracking-heading)">
          Design system
        </h1>
        <p className="mt-1 text-xs text-text-muted">
          Small details. One shared language. Reference-led components for the PRAX platform.
        </p>
        <p
          role="status"
          className={`mt-2 text-[10px] ${fontStatus.includes("failed") ? "text-danger-text" : "text-success-text"}`}
        >
          {fontStatus}
        </p>
      </div>
      <nav
        aria-label="Component sections"
        className="flex flex-wrap gap-x-5 gap-y-2 border-b border-border pb-3 text-[11px] font-semibold text-text-muted"
      >
        {sections.map((label) => (
          <a
            key={label}
            href={`#${label.toLowerCase()}`}
            className="hover:text-primary max-sm:py-2"
          >
            {label}
          </a>
        ))}
      </nav>

      <Section
        id="foundations"
        title="01 / Foundations"
        description="Sampled across all 20 reference pages"
      >
        <Specimen>
          <div className="grid grid-cols-5 gap-3 max-sm:grid-cols-2">
            {swatches.map(([label, token, hex]) => (
              <div key={token}>
                <div
                  className="mb-2 h-10 rounded-md border border-border"
                  style={{ background: `var(--color-${token})` }}
                />
                <p className="text-[11px] font-semibold">{label}</p>
                <p className="text-[10px] text-text-muted">{hex}</p>
              </div>
            ))}
          </div>
        </Specimen>
        <div className="mt-3 grid gap-(--layout-card-gap) md:grid-cols-2">
          <Specimen>
            <p className="mb-3 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
              Inter / Typography
            </p>
            <p className="text-2xl leading-tight font-bold tracking-tight">
              Build something meaningful.
            </p>
            <p className="mt-2 text-sm font-semibold">Panel title · 14 / 18</p>
            <p className="mt-2 text-xs">Body · 12 / 18.6 · Clear proof. Real progress.</p>
            <p className="mt-2 text-[11px] text-text-muted">Muted label · 11 / 17</p>
            <div className="mt-4 flex flex-wrap gap-4">
              {[400, 500, 600, 700, 800].map((weight) => (
                <span key={weight} style={{ fontWeight: weight }}>
                  Aa {weight}
                </span>
              ))}
            </div>
          </Specimen>
          <Specimen>
            <p className="mb-3 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
              Layout reference / 1080 × 675
            </p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
              {[
                ["Sidebar / header", "174 / 56.25 px"],
                ["Workspace inset", "25.5 px"],
                ["Panel corner / gap", "12.75 / 13.5 px"],
                ["Task artwork", "79.5 × 75 px"],
                ["Task card", "182.25 px min"],
                ["Controls / mobile", "28–36 / 44 px"],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt className="text-text-muted">{key}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-end gap-3">
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <div key={n} className="text-center text-[9px] text-text-muted">
                  <div
                    className="mb-1 bg-lavender"
                    style={{ width: `var(--space-${n})`, height: `var(--space-${n})` }}
                  />
                  {n * 4}
                </div>
              ))}
            </div>
          </Specimen>
        </div>
      </Section>

      <Section
        id="actions"
        title="02 / Actions"
        description="Hover, hold, or Tab to inspect interaction states"
      >
        <Specimen>
          <div className="flex flex-wrap items-center gap-2">
            <Button leftIcon={<Icon name="arrow" />} onClick={save} isLoading={saving}>
              Save changes
            </Button>
            <Button variant="secondary" onClick={() => setToast("Secondary action selected.")}>
              Save draft
            </Button>
            <Button variant="text" onClick={() => setToast("Text action selected.")}>
              View all <Icon name="arrow" size={12} />
            </Button>
            <Button
              variant="destructive"
              leftIcon={<Icon name="trash" />}
              onClick={() => setDialog(true)}
            >
              Delete draft
            </Button>
            <Button
              iconOnly
              variant="secondary"
              aria-label="Add item"
              onClick={() => setToast("An item was added to the example.")}
            >
              <Icon name="plus" />
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
            <Button isLoading>Saving…</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="lavender">Lavender</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger alias</Button>
          </div>
          <p className="mt-3 text-[10px] text-text-muted">
            Violet focus outline · darker pressed fill · disabled and loading actions cannot submit.
          </p>
        </Specimen>
      </Section>

      <Section
        id="forms"
        title="03 / Form controls"
        description="Native controls, linked labels, local validation"
      >
        <Specimen>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const next: Record<string, string> = {};
              if (!String(data.get("title") || "").trim()) next.title = "Enter a task title.";
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("email"))))
                next.email = "Enter a valid email address.";
              if (!String(data.get("proof") || "").startsWith("https://"))
                next.proof = "Use a full HTTPS link.";
              setErrors(next);
              if (!Object.keys(next).length) setToast("Example form validated. No data was sent.");
              else
                event.currentTarget
                  .querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`)
                  ?.focus();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Task title"
                name="title"
                required
                placeholder="Optimise one slow SQL query"
                error={errors.title}
              />
              <Input
                label="Email address"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@studio.dev"
                error={errors.email}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                helperText="Use at least 8 characters."
                minLength={8}
                placeholder="Enter a password"
              />
              <Input
                label="Proof link"
                name="proof"
                type="url"
                required
                leftIcon={<Icon name="link" size={14} />}
                placeholder="https://github.com/…"
                error={errors.proof}
              />
              <Input
                label="Search tasks"
                type="search"
                leftIcon={<Icon name="search" size={14} />}
                placeholder="Search tasks, categories or skills"
              />
              <Select label="Category" defaultValue="backend">
                <option value="backend">Backend</option>
                <option value="frontend">Frontend</option>
                <option value="design">UI/UX Design</option>
              </Select>
              <div className="sm:col-span-2">
                <Textarea
                  label="Note to reviewer"
                  placeholder="Explain what changed and how you measured it."
                  helperText="Keep your evidence easy to verify."
                />
              </div>
              <div className="flex flex-col justify-center gap-3">
                <Checkbox label="I checked my proof link" />
                <Toggle
                  label="Review notifications"
                  checked={notifications}
                  onChange={(event) => setNotifications(event.target.checked)}
                  helperText={notifications ? "Notifications are on." : "Notifications are off."}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button type="submit">Validate example</Button>
              <span className="text-[10px] text-text-muted">Submit empty to review errors.</span>
            </div>
          </form>
        </Specimen>
        <Specimen className="mt-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Invalid link"
              type="url"
              defaultValue="github/project"
              error="Include https:// in your proof link."
            />
            <Select label="Required category" defaultValue="" required error="Choose a category.">
              <option value="">Choose category</option>
              <option>Backend</option>
            </Select>
            <Textarea
              label="Feedback required"
              error="Explain what the builder should improve."
              rows={2}
            />
            <Checkbox label="Agreement required" error="Confirm before continuing." required />
            <Toggle label="Disabled preference" disabled />
            <Input label="Read-only value" defaultValue="PRAX community" readOnly />
          </div>
          <fieldset disabled className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
            <legend className="text-[10px] font-semibold text-text-muted">Disabled controls</legend>
            <Input label="Display name" defaultValue="Arjun Varma" />
            <Input label="Disabled email" type="email" defaultValue="arjun@example.test" />
            <Input label="Disabled password" type="password" defaultValue="example-password" />
            <Input label="Disabled URL" type="url" defaultValue="https://example.test" />
            <Input label="Disabled search" type="search" />
            <Select label="Disabled category">
              <option>Backend</option>
            </Select>
            <Textarea label="Disabled notes" rows={2} />
            <Checkbox label="Disabled checkbox" defaultChecked />
            <Toggle label="Disabled toggle" defaultChecked />
          </fieldset>
        </Specimen>
      </Section>

      <Section
        id="identity"
        title="04 / Status, categories & avatars"
        description="Compact fills and explicit status labels"
      >
        <Specimen>
          <div className="flex flex-wrap gap-2">
            {Object.keys(statuses).map((status) => (
              <StatusBadge key={status} status={status as keyof typeof statuses} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Backend", "Frontend", "UI/UX Design", "Writing", "Developer tools"].map(
              (category) => (
                <CategoryTag key={category}>{category}</CategoryTag>
              )
            )}
            <Badge variant="info" dot>
              Information
            </Badge>
            <Badge variant="success" dot>
              Verified
            </Badge>
          </div>
          <div className="mt-5 flex flex-wrap items-end gap-5 border-t border-border-subtle pt-4">
            {(["xs", "sm", "md", "lg", "xl", "profile"] as const).map((size, i) => (
              <div key={size} className="text-center">
                <Avatar
                  name={i % 2 ? "Meera Shah" : "Arjun Varma"}
                  size={size}
                  colorScheme={i % 2 ? "orange" : "purple"}
                />
                <p className="mt-2 text-[10px] text-text-muted">{size}</p>
              </div>
            ))}
            <div className="text-center">
              <Avatar name="Arjun Varma" src="/artwork/avatar-reference.png" size="sm" />
              <p className="mt-2 text-[10px] text-text-muted">Image</p>
            </div>
            <Avatar name="Rohan Das" colorScheme="teal" isOnline />
            <Avatar name="Dev Mehta" colorScheme="blue" />
            <Avatar name="Neil Joseph" colorScheme="green" />
            <Avatar name="Guest" colorScheme="gray" />
          </div>
        </Specimen>
      </Section>

      <Section
        id="navigation"
        title="05 / Navigation primitives"
        description="Use arrow keys within tabs and segmented choices"
      >
        <div className="grid items-start gap-(--layout-card-gap) md:grid-cols-[220px_1fr]">
          <div className="rounded-panel bg-sidebar p-3">
            <SidebarNavItem href="#navigation" selected icon={<Icon name="grid" size={14} />}>
              Dashboard
            </SidebarNavItem>
            <SidebarNavItem href="#panels" icon={<Icon name="file" size={14} />}>
              Tasks
            </SidebarNavItem>
            <SidebarNavItem href="#tables" icon={<Icon name="check" size={14} />}>
              My submissions
            </SidebarNavItem>
          </div>
          <Specimen>
            <Breadcrumb
              items={[
                { label: "PRAX", href: "#foundations" },
                { label: "Tasks", href: "#panels" },
                { label: "Task detail" },
              ]}
            />
            <div className="mt-4">
              <Tabs
                tabs={[
                  {
                    id: "all",
                    label: "All",
                    count: 24,
                    content: "All tasks are shown in this example.",
                  },
                  { id: "open", label: "Open", count: 14, content: "Open tasks selected." },
                  { id: "done", label: "Approved", count: 6, content: "Approved tasks selected." },
                  { id: "disabled", label: "Archived", disabled: true },
                ]}
                activeTab={tab}
                onChange={setTab}
              />
            </div>
            <Tabs
              label="Task details"
              variant="underline"
              tabs={[
                { id: "proof", label: "Proof", content: "Your proof links and screenshots." },
                { id: "feedback", label: "Feedback", content: "Reviewer notes appear here." },
              ]}
              activeTab={underline}
              onChange={setUnderline}
            />
            <SegmentedControl
              label="Leaderboard period"
              options={[
                { value: "weekly", label: "Weekly" },
                { value: "all-time", label: "All-time" },
              ]}
              value={period}
              onChange={setPeriod}
            />
            <p className="mt-2 text-[10px] text-text-muted">Selected period: {period}</p>
            <div className="mt-4 border-t border-border-subtle pt-3">
              <p className="mb-2 text-[10px] text-text-muted">
                Segmented tabs / shared panel selection
              </p>
              <Tabs
                label="Segmented task details"
                variant="segmented"
                tabs={[
                  { id: "proof", label: "Proof", content: "Your proof links and screenshots." },
                  { id: "feedback", label: "Feedback", content: "Reviewer notes appear here." },
                ]}
                activeTab={underline}
                onChange={setUnderline}
              />
            </div>
          </Specimen>
        </div>
      </Section>

      <Section
        id="panels"
        title="06 / Panels, cards & progress"
        description="Reference proportions, without a workspace shell"
      >
        <div className="grid items-start gap-(--layout-card-gap) md:grid-cols-3">
          <TaskCard
            title="Optimise one slow SQL query"
            description="Profile a slow query, ship an improvement, and show your before/after data."
            category="Backend"
            points={35}
            artwork="/artwork/task-sql.png"
            deadline="Due in 2d"
          />
          <StatCard
            label="This week"
            value="185"
            subtext="40 more than last week"
            subtextTrend="up"
            icon={<Icon name="star" size={14} />}
          />
          <Card>
            <CardHeader>
              <CardTitle>Your goals</CardTitle>
              <CardDescription>Small steps add up.</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress label="Ship three side projects" value={66} showValue />
              <div className="mt-4">
                <Progress label="Master PostgreSQL internals" value={40} showValue />
              </div>
            </CardContent>
            <CardFooter className="px-4 py-3 text-[10px] text-text-muted">
              Updated just now
            </CardFooter>
          </Card>
        </div>
        <div className="mt-3 grid gap-(--layout-card-gap) md:grid-cols-3">
          <Specimen>
            <Progress label="No progress yet" value={0} showValue />
          </Specimen>
          <Specimen>
            <Progress label="Goal completed" value={100} showValue />
          </Specimen>
          <Specimen>
            <Progress label="185 of 201 points" value={185} max={201} />
          </Specimen>
        </div>
      </Section>

      <Section
        id="tables"
        title="07 / Table primitives"
        description="Compact rows, thin separators, scrollable on mobile"
      >
        <TableContainer>
          <div className="flex items-center justify-between p-4">
            <h3 className="text-sm font-bold">Submission history</h3>
            <Badge size="sm">3 submissions</Badge>
          </div>
          <Table aria-label="Submission history">
            <caption className="sr-only">Example task submissions and reviewer feedback</caption>
            <TableHeader>
              <TableRow>
                {["Task", "Status", "Points", "Reviewer feedback", "Action"].map((text) => (
                  <TableHead key={text}>{text}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <tbody>
              {[
                [
                  "Redesign onboarding for a fintech app",
                  "awaiting-review",
                  "—",
                  "Awaiting admin feedback",
                ],
                [
                  "Build a REST API for a habit tracker",
                  "approved",
                  "55 / 60",
                  "Clean routes. Add rate limiting.",
                ],
                [
                  "Open-source a useful CLI tool",
                  "rejected",
                  "0 / 70",
                  "README needs install steps.",
                ],
              ].map(([title, status, points, feedback]) => (
                <TableRow key={title}>
                  <TableCell>
                    <p className="min-w-40 font-semibold">{title}</p>
                    <p className="mt-1 text-[10px] text-text-muted">Oct 9 · 07:12</p>
                  </TableCell>
                  <StatusCell status={status as keyof typeof statuses} />
                  <TableCell className="whitespace-nowrap font-semibold">{points}</TableCell>
                  <TableCell className="text-text-muted">{feedback}</TableCell>
                  <ActionCell>
                    <Button
                      variant="text"
                      size="sm"
                      aria-label={`View ${title}`}
                      onClick={() => setToast(`Example: ${title}`)}
                    >
                      View <Icon name="arrow" size={12} />
                    </Button>
                  </ActionCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
        <TableContainer className="mt-3">
          <Table aria-label="Empty submissions">
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              <TableEmptyState colSpan={2}>No submissions match your filters.</TableEmptyState>
            </tbody>
          </Table>
        </TableContainer>
      </Section>

      <Section
        id="upload"
        title="08 / Screenshot upload"
        description="Local preview only · selection, drop, validation and removal"
      >
        <div className="grid gap-(--layout-card-gap) md:grid-cols-3">
          <Specimen>
            <FileUpload />
          </Specimen>
          <Specimen>
            <FileUpload
              label="Screenshot with validation"
              error="Choose a PNG or JPEG smaller than 5 MB."
            />
          </Specimen>
          <Specimen>
            <FileUpload disabled label="Disabled upload" />
          </Specimen>
        </div>
      </Section>

      <Section
        id="feedback"
        title="09 / Feedback"
        description="Status is always expressed in words"
      >
        <div className="grid gap-(--layout-card-gap) md:grid-cols-2">
          <Specimen className="space-y-3">
            <Notice title="Good work deserves credit.">Make your evidence easy to verify.</Notice>
            <Notice tone="success" title="Submission approved">
              55 points awarded for verified work.
            </Notice>
            <Notice tone="warning" title="Awaiting review">
              Your proof is in the review queue.
            </Notice>
            <Notice tone="danger" title="Could not save">
              Check the highlighted fields and try again.
            </Notice>
            <ErrorMessage>Your proof link is missing.</ErrorMessage>
            <Button variant="secondary" onClick={() => setToast("Your changes have been saved.")}>
              Show toast
            </Button>
          </Specimen>
          <Specimen>
            <EmptyState
              title="No submissions yet"
              description="Your verified work starts with one small task."
              action={
                <Button
                  size="sm"
                  onClick={() => setToast("Task browsing belongs to the next stage.")}
                >
                  Browse tasks <Icon name="arrow" size={12} />
                </Button>
              }
            />
            <div className="mt-3 space-y-2 border-t border-border-subtle pt-4">
              <Skeleton className="h-3 w-1/3" label="Loading task title" />
              <Skeleton className="h-3 w-full" label="Loading task description" />
              <Skeleton className="h-3 w-2/3" label="Loading task details" />
            </div>
          </Specimen>
        </div>
      </Section>

      <Section
        id="dialog"
        title="10 / Shared dialog & icons"
        description="Escape to dismiss · focus stays inside · returns to opener"
      >
        <Specimen>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button variant="secondary" onClick={() => setDialog(true)}>
              Open dialog
            </Button>
            <div className="flex flex-wrap items-center gap-4 text-text-muted">
              {(
                [
                  "grid",
                  "file",
                  "search",
                  "clock",
                  "trophy",
                  "star",
                  "upload",
                  "link",
                  "check",
                  "trash",
                  "info",
                  "close",
                ] as IconName[]
              ).map((name) => (
                <span key={name} title={name}>
                  <Icon name={name} />
                </span>
              ))}
            </div>
          </div>
        </Specimen>
      </Section>
      <p className="border-t border-border pt-4 text-[10px] text-text-muted">
        PRAX foundation · PDF reference, pages 1–20 · No application screens or backend services
        added.
      </p>
      <Dialog
        isOpen={dialog}
        onClose={() => setDialog(false)}
        title="Review your changes"
        subtitle="A shared dialog for focused decisions."
        badge="PRAX workspace"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setDialog(false);
                setToast("Example confirmed. No records were changed.");
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Notice>Changes in this review page stay in your browser.</Notice>
        <div className="mt-4">
          <Input label="Review note" placeholder="Add a short note" />
        </div>
      </Dialog>
      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}
    </main>
  );
}
