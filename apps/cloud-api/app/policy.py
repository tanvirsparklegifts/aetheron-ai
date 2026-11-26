from dataclasses import dataclass
from enum import StrEnum


class ActionRisk(StrEnum):
    READ_ONLY = "read_only"
    SENSITIVE = "sensitive"


SENSITIVE_ACTIONS = frozenset({
    "send_message",
    "publish_public_content",
    "purchase",
    "payment",
    "legal_commitment",
    "account_change",
    "delete_data",
    "external_write",
})


@dataclass(frozen=True)
class PolicyDecision:
    allowed: bool
    requires_approval: bool
    risk: ActionRisk
    reason: str


def evaluate_action(action: str, granted_scopes: set[str]) -> PolicyDecision:
    """Return a policy requirement; this function never executes a tool.

    Approval must be verified separately against a server-side, expiring approval
    record bound to the exact action payload. A client boolean is not approval.
    """
    if action not in granted_scopes:
        return PolicyDecision(
            allowed=False,
            requires_approval=False,
            risk=ActionRisk.SENSITIVE if action in SENSITIVE_ACTIONS else ActionRisk.READ_ONLY,
            reason="The required integration scope has not been granted.",
        )

    if action in SENSITIVE_ACTIONS:
        return PolicyDecision(
            allowed=False,
            requires_approval=True,
            risk=ActionRisk.SENSITIVE,
            reason="Explicit, action-bound user approval is required before execution.",
        )

    return PolicyDecision(
        allowed=True,
        requires_approval=False,
        risk=ActionRisk.READ_ONLY,
        reason="The requested action is within the granted read-only scope.",
    )
