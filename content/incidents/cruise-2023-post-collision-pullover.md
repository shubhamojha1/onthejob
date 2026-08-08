---
id: cruise-2023-post-collision-pullover
company: Cruise
title: "The collision logic that chose to keep moving"
year: 2023
date: "2023-10-02"
duration: "24 days to fleet pause"
classes:
  - automation-misfire
patterns:
  - misclassification-to-action
  - unsafe-fallback-action
  - rare-scenario-gap
impact: "A driverless Cruise vehicle pulled a pedestrian forward after contact; Cruise paused its driverless fleet 24 days later and recalled the collision-detection software installed on 950 automated-driving systems."
trigger: "A human-driven vehicle struck a pedestrian and propelled the person onto the ground directly in the autonomous vehicle's path, forcing an unusual post-collision decision."
mechanism: "The Cruise vehicle braked aggressively but still made contact. Its subsystem chose between pulling over and remaining stationary using perceived actors, impact location, and severity; it mischaracterized this as a lateral collision and commanded a pullover while the pedestrian was low beneath its path. Cruise then used historical driving data and simulation to test recurrence."
lesson: "When perception is uncertain after a collision, the minimum-risk fallback must prevent additional motion. Test rare, high-severity scenarios in simulation, constrain uncertain classifications from authorizing irreversible actuation, and evaluate the complete perception-to-action chain. Cruise's remedy would have kept the vehicle stationary."
interview: "Discuss fail-safe planning: carry confidence into the planner, separate uncertain classification from actuation, default to a stationary state after impact, and require simulation-based safety evidence before restoring a driverless fleet."
source: "https://static.nhtsa.gov/odi/rcl/2023/RCLRPT-23E086-7725.PDF"
sourceLabel: "NHTSA Part 573 recall report"
source_quote: "After coming to an initial stop, the AV attempted to pull over out of traffic, pulling the individual forward."
archive_url: ""
date_added: "2026-08-08"
last_verified: "2026-08-08"
verified: true
---
