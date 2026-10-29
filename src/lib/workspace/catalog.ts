export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  pointsMax: number;
  deadline: string;
  status: "Open" | "Pending" | "Approved" | "Rejected";
  statusNote?: string;
  thumbnailType: "code" | "terminal" | "bars" | "doc";
}

export const tasks: TaskItem[] = [
  {
    id: "1",
    title: "Optimise one slow SQL query",
    description: "Profile a slow query, ship an improvement, and show your before/after data.",
    category: "Backend",
    pointsMax: 35,
    deadline: "Due in 2d",
    status: "Open",
    thumbnailType: "code",
  },
  {
    id: "2",
    title: "Ship a landing page in 3 hours",
    description: "Create a polished responsive page for a fictional product.",
    category: "Frontend",
    pointsMax: 40,
    deadline: "Due tomorrow",
    status: "Open",
    thumbnailType: "doc",
  },
  {
    id: "3",
    title: "Build a REST API for habits",
    description: "Build secure endpoints with authentication and tests.",
    category: "Backend",
    pointsMax: 60,
    deadline: "Completed",
    status: "Approved",
    statusNote: "+55 earned",
    thumbnailType: "terminal",
  },
  {
    id: "4",
    title: "Redesign a product onboarding",
    description: "Improve first-time user experience with clear flows.",
    category: "UI/UX Design",
    pointsMax: 50,
    deadline: "Under review",
    status: "Pending",
    thumbnailType: "bars",
  },
  {
    id: "5",
    title: "Write a thoughtful product teardown",
    description: "Study a tool you love and share sharp insights.",
    category: "Writing",
    pointsMax: 30,
    deadline: "No deadline",
    status: "Open",
    thumbnailType: "doc",
  },
  {
    id: "6",
    title: "Open-source a useful CLI tool",
    description: "Make a tiny developer tool that solves a real pain.",
    category: "Developer tools",
    pointsMax: 70,
    deadline: "Resubmit",
    status: "Rejected",
    thumbnailType: "terminal",
  },
];

// Existing reference data remains illustrative until the points-ledger integration lands.
export const sampleBuilders = [
  { id: "kabir", name: "Kabir Nair", weekly: 301, alltime: 1510, streak: 21 },
  { id: "meera", name: "Meera Shah", weekly: 268, alltime: 1610, streak: 18 },
  { id: "rohan", name: "Rohan Das", weekly: 212, alltime: 980, streak: 7 },
  { id: "sana", name: "Sana Patel", weekly: 201, alltime: 1320, streak: 18 },
  { id: "dev", name: "Dev Mehta", weekly: 196, alltime: 1100, streak: 9 },
  { id: "isha", name: "Isha Rao", weekly: 188, alltime: 1420, streak: 12 },
  { id: "usr_member_01", name: "Arjun Varma", weekly: 185, alltime: 1240, streak: 12 },
  { id: "tara", name: "Tara Bose", weekly: 160, alltime: 1170, streak: 4 },
];
