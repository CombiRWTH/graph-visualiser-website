use crate::Property;
use serde::{Deserialize, Serialize};
use std::num::{NonZeroU16, NonZeroU32, NonZeroU64, NonZeroU8, NonZeroUsize};

pub trait LinkWeight {
	fn properties(&self) -> &'static [Property];
}

macro_rules! impl_link_weight {
	($($ty:ty),*: [$($prop:expr),*]) => {
		const _: () = {
			const PROPERTIES: &'static [Property] = &[$($prop),*];
			$(
				impl LinkWeight for $ty {
					/// Returns the static property list for the type
					#[doc = concat!("[`", stringify!($ty), "`]")]
					///
					/// This method does not look at the value of the link weight, the
					/// properties are only based on what the type is capable of storing.
					fn properties(&self) -> &'static [Property] {
						PROPERTIES
					}
				}
			)*
		};
	};
}

impl_link_weight! {
	(): [Property::UnweightedLinks]
}

// we will skip the 128 bit variants: AnyWeight doesn't support them
impl_link_weight! {
	NonZeroU8, NonZeroU16, NonZeroU32, NonZeroU64, NonZeroUsize: [
		Property::PositiveWeightedLinks,
		Property::NonNegativeWeightedLinks,
		Property::WeightedLinks
	]
}

impl_link_weight! {
	u8, u16, u32, u64, usize: [
		Property::NonNegativeWeightedLinks,
		Property::WeightedLinks
	]
}

impl_link_weight! {
	i8, i16, i32, i64, isize, f32, f64: [Property::WeightedLinks]
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Link<W: LinkWeight> {
	pub source: usize,
	pub target: usize,

	pub weight: W
}

impl<W: LinkWeight> Link<W> {
	pub fn new(source: usize, target: usize, weight: W) -> Self {
		Self { source, target, weight }
	}
}
