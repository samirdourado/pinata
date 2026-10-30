use anchor_lang::prelude::*;

#[error_code]
pub enum PinataError {
    #[msg("Fee split must add up to exactly 10000 basis points")]
    InvalidFeeSplit,
    #[msg("Invalid configuration value")]
    InvalidConfig,
    #[msg("The platform share of the minimum comment does not cover the ticket storage deposit")]
    MinimumCommentTooLow,
    #[msg("This creator already has an active Piñata")]
    CreatorPinataAlreadyActive,
    #[msg("Round must be the creator's next round")]
    InvalidRound,
    #[msg("Target is outside the allowed range")]
    TargetOutOfRange,
    #[msg("Minimum burst percentage is outside the allowed range")]
    ThresholdOutOfRange,
    #[msg("Comment amount is below the minimum")]
    CommentBelowMinimum,
    #[msg("This Piñata is not open")]
    PinataNotOpen,
    #[msg("This Piñata has not been drawn yet")]
    PinataNotDrawn,
    #[msg("Creator account is not the owner of this Piñata")]
    CreatorMismatch,
    #[msg("Wrong kind of Piñata for this instruction")]
    WrongPinataKind,
    #[msg("The Piñata has not reached the amount needed to burst")]
    BurstThresholdNotReached,
    #[msg("Only the owner can burst a Piñata before it is full")]
    OnlyOwnerCanBurstEarly,
    #[msg("Winner accounts do not match the drawn winners")]
    WinnerMismatch,
    #[msg("The creator profile is required to settle a creator Piñata")]
    MissingCreatorProfile,
    #[msg("Unexpected VRF account")]
    InvalidVrfAccount,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
