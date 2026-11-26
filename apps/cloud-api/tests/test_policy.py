from app.policy import ActionRisk, evaluate_action


def test_read_only_action_is_allowed_with_scope() -> None:
    decision = evaluate_action("read_calendar", {"read_calendar"})
    assert decision.allowed is True
    assert decision.requires_approval is False
    assert decision.risk == ActionRisk.READ_ONLY


def test_sensitive_action_requires_explicit_approval() -> None:
    decision = evaluate_action("send_message", {"send_message"})
    assert decision.allowed is False
    assert decision.requires_approval is True
    assert decision.risk == ActionRisk.SENSITIVE


def test_action_without_scope_is_denied() -> None:
    decision = evaluate_action("read_files", set())
    assert decision.allowed is False
    assert decision.requires_approval is False
