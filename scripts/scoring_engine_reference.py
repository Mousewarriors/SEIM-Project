"""
SOC Lab Scoring Engine (reference implementation)
- deterministic: based on analyst actions + entities discovered
- flexible: supports per-scenario required_actions + optional bonuses
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Any

@dataclass
class ScoreResult:
    score: int
    max_score: int
    missing_actions: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)

def score_case(scenario: Dict[str, Any], analyst: Dict[str, Any]) -> ScoreResult:
    """
    scenario: loaded scenario YAML/JSON (contains scoring.required_actions, max_score)
    analyst:  runtime record of what the user did, e.g.
        {
          "completed_actions": ["identify_encoded_powershell", "extract_iocs", ...],
          "found_iocs": {"ips": [...], "domains": [...], "hashes": [...]},
          "final_severity": "high",
          "case_status": "resolved",
          "notes": "..."
        }
    """
    required = scenario["scoring"]["required_actions"]
    max_score = scenario["scoring"]["max_score"]

    completed: Set[str] = set(analyst.get("completed_actions", []))
    missing = [a for a in required if a not in completed]

    # Simple model: each required action worth equal points
    per = max_score // max(len(required), 1)
    score = (len(required) - len(missing)) * per

    # Optional: bonuses for good hygiene
    bonuses = 0
    if analyst.get("case_status") in ("resolved", "closed"):
        bonuses += 5
    if analyst.get("notes") and len(analyst["notes"].strip()) > 120:
        bonuses += 5

    score = min(max_score, score + bonuses)
    return ScoreResult(score=score, max_score=max_score, missing_actions=missing)

def record_action(state: Dict[str, Any], action: str) -> None:
    state.setdefault("completed_actions", [])
    if action not in state["completed_actions"]:
        state["completed_actions"].append(action)

def record_ioc(state: Dict[str, Any], ioc_type: str, value: str) -> None:
    state.setdefault("found_iocs", {}).setdefault(ioc_type, [])
    if value not in state["found_iocs"][ioc_type]:
        state["found_iocs"][ioc_type].append(value)
