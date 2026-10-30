pub mod consume_randomness;
pub mod initialize;
pub mod open_creator_pinata;
pub mod pay_comment;
pub mod request_creator_draw;
pub mod request_platform_draw;
pub mod settle;
pub mod update_config;
pub mod vrf;

// #[program] needs every Accounts struct at the crate root. Each module also has
// a `handler`, which lib.rs always calls through its module path.
#[allow(ambiguous_glob_reexports)]
pub use {
    consume_randomness::*, initialize::*, open_creator_pinata::*, pay_comment::*,
    request_creator_draw::*, request_platform_draw::*, settle::*, update_config::*, vrf::*,
};
