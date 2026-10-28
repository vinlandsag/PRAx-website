"use client";

import React from "react";
import { ProfileView } from "@/components/profile/ProfileView";

export default function MemberProfilePage() {
  return (
    <ProfileView
      isPublic
      name="Meera Shah"
      handle="@meerashah"
      bio="Designer and developer, making thoughtful digital experiences."
      totalPoints="1,610"
      weeklyRank="#2"
      dayStreak="18"
      tasksApproved="32"
      currentProject="Design system for indie founders"
    />
  );
}
