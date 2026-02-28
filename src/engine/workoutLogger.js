// workoutLogger.js — converts logged sets to Liftosaur-compatible rows

export const EXERCISE_LIST = [
  "Squat", "Bench Press", "Deadlift", "Overhead Press", "Romanian Deadlift",
  "Barbell Row", "Pull-Up", "Push-Up", "Dip", "Incline Bench Press",
  "Leg Press", "Lat Pulldown", "Cable Row", "Tricep Pushdown", "Bicep Curl",
  "Front Squat", "Sumo Deadlift", "Hack Squat", "Bulgarian Split Squat",
  "Hip Thrust", "Face Pull", "Arnold Press", "Lateral Raise", "Chest Fly",
  "Leg Curl", "Leg Extension", "Calf Raise", "Ab Wheel", "Plank",
];

export const TEMPLATES = {
  "Push": {
    exercises: [
      { name: "Bench Press",      sets: [{ reps: 5, weight: 185 }, { reps: 5, weight: 185 }, { reps: 5, weight: 185 }] },
      { name: "Overhead Press",   sets: [{ reps: 8, weight: 115 }, { reps: 8, weight: 115 }] },
      { name: "Incline Bench Press", sets: [{ reps: 10, weight: 135 }, { reps: 10, weight: 135 }] },
      { name: "Tricep Pushdown",  sets: [{ reps: 12, weight: 60  }, { reps: 12, weight: 60  }] },
    ],
  },
  "Pull": {
    exercises: [
      { name: "Barbell Row",   sets: [{ reps: 5, weight: 185 }, { reps: 5, weight: 185 }, { reps: 5, weight: 185 }] },
      { name: "Pull-Up",       sets: [{ reps: 6, weight: 0 }, { reps: 6, weight: 0 }] },
      { name: "Lat Pulldown",  sets: [{ reps: 10, weight: 130 }, { reps: 10, weight: 130 }] },
      { name: "Bicep Curl",    sets: [{ reps: 12, weight: 40 }, { reps: 12, weight: 40 }] },
    ],
  },
  "Legs": {
    exercises: [
      { name: "Squat",                    sets: [{ reps: 5, weight: 225 }, { reps: 5, weight: 225 }, { reps: 5, weight: 225 }] },
      { name: "Romanian Deadlift",        sets: [{ reps: 8, weight: 185 }, { reps: 8, weight: 185 }] },
      { name: "Bulgarian Split Squat",    sets: [{ reps: 10, weight: 60 }, { reps: 10, weight: 60 }] },
      { name: "Leg Curl",                 sets: [{ reps: 12, weight: 80 }, { reps: 12, weight: 80 }] },
    ],
  },
  "5/3/1 Squat": {
    exercises: [
      { name: "Squat", sets: [{ reps: 5, weight: 180 }, { reps: 3, weight: 205 }, { reps: 1, weight: 225 }] },
      { name: "Leg Press", sets: [{ reps: 10, weight: 300 }, { reps: 10, weight: 300 }, { reps: 10, weight: 300 }] },
      { name: "Leg Curl",  sets: [{ reps: 10, weight: 80  }, { reps: 10, weight: 80  }, { reps: 10, weight: 80  }] },
    ],
  },
  "5/3/1 Bench": {
    exercises: [
      { name: "Bench Press",    sets: [{ reps: 5, weight: 155 }, { reps: 3, weight: 175 }, { reps: 1, weight: 195 }] },
      { name: "Dip",            sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }] },
      { name: "Tricep Pushdown", sets: [{ reps: 12, weight: 60 }, { reps: 12, weight: 60 }] },
    ],
  },
  "5/3/1 Deadlift": {
    exercises: [
      { name: "Deadlift",   sets: [{ reps: 5, weight: 225 }, { reps: 3, weight: 255 }, { reps: 1, weight: 285 }] },
      { name: "Barbell Row", sets: [{ reps: 5, weight: 155 }, { reps: 5, weight: 155 }, { reps: 5, weight: 155 }] },
      { name: "Pull-Up",    sets: [{ reps: 6, weight: 0 }, { reps: 6, weight: 0 }, { reps: 6, weight: 0 }] },
    ],
  },
};

// Convert logged exercises/sets to Liftosaur CSV row format
export function buildLiftosaurRows(exercises) {
  const todayISO = new Date().toISOString();
  const rows = [];
  exercises.forEach((ex, exIdx) => {
    ex.sets.forEach((set, setIdx) => {
      if (!set.completed) return;
      rows.push({
        "Date": todayISO,
        "Exercise Name": ex.name,
        "Set Order": String(setIdx + 1),
        "Weight": String(set.weight || 0),
        "Reps": String(set.reps || 0),
        "RPE": "",
        "Notes": "",
        "Workout Name": ex.workoutName || "Iron Sovereign",
        "Workout Notes": "",
      });
    });
  });
  return rows;
}

// Save workout summary to localStorage history
export function saveWorkoutHistory(exercises, totalVolume) {
  const key = "iron_sovereign_workouts";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  const entry = {
    date: new Date().toLocaleDateString(),
    volume: totalVolume,
    exercises: exercises.map(e => ({
      name: e.name,
      sets: e.sets.filter(s => s.completed).length,
      topWeight: Math.max(0, ...e.sets.filter(s => s.completed).map(s => s.weight || 0)),
    })),
    timestamp: Date.now(),
  };
  const updated = [entry, ...existing].slice(0, 7);
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export function loadWorkoutHistory() {
  try {
    return JSON.parse(localStorage.getItem("iron_sovereign_workouts") || "[]");
  } catch {
    return [];
  }
}
