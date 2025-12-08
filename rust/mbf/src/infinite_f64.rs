use serde::de::{self, Visitor};
use serde_with::{DeserializeAs, SerializeAs};
use std::fmt::{self, Formatter};

/// workaround since serde-json doesn't support infinity.
pub(super) struct InfiniteF64;

impl<'de> DeserializeAs<'de, f64> for InfiniteF64 {
	fn deserialize_as<D>(deserializer: D) -> Result<f64, D::Error>
	where
		D: serde::Deserializer<'de>
	{
		struct Helper;
		impl<'de> Visitor<'de> for Helper {
			type Value = f64;

			fn expecting(&self, f: &mut Formatter<'_>) -> fmt::Result {
				f.write_str("an (infinite) float")
			}

			fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
			where
				E: serde::de::Error
			{
				match v {
					"INF" => Ok(f64::INFINITY),
					"-INF" => Ok(f64::NEG_INFINITY),
					_ => Err(de::Error::custom("invalid string value"))
				}
			}

			fn visit_i64<E>(self, v: i64) -> Result<Self::Value, E>
			where
				E: de::Error
			{
				Ok(v as _)
			}

			fn visit_u64<E>(self, v: u64) -> Result<Self::Value, E>
			where
				E: de::Error
			{
				Ok(v as _)
			}

			fn visit_f64<E>(self, v: f64) -> Result<Self::Value, E>
			where
				E: de::Error
			{
				Ok(v)
			}
		}
		deserializer.deserialize_any(Helper)
	}
}

impl SerializeAs<f64> for InfiniteF64 {
	fn serialize_as<S>(source: &f64, serializer: S) -> Result<S::Ok, S::Error>
	where
		S: serde::Serializer
	{
		match *source {
			v if v == f64::INFINITY => serializer.serialize_str("INF"),
			v if v == f64::NEG_INFINITY => serializer.serialize_str("-INF"),
			v => serializer.serialize_f64(v)
		}
	}
}
