use std::{fmt::Display, str::FromStr};

// Explanation for this module
// Converting a HashMap whose key is a tuple of numbers is problematic for javascript
// Generally, keys are specified as strings in javascript so we need this module to help out with the conversion

#[derive(Debug, PartialEq, Eq)]
pub struct ParseUSizeTupleError;

// Custom struct for links so we can use them as keys in a hashmap
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct KeyLink(pub (usize, usize));

impl FromStr for KeyLink {
	type Err = ParseUSizeTupleError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		// Get string parts
		let (x, y) = s
			.strip_prefix('(')
			.and_then(|s| s.strip_suffix(')'))
			.and_then(|s| s.split_once(','))
			.ok_or(ParseUSizeTupleError)?;

		// Convert string to usize
		let x_fromstr = x.parse::<usize>().map_err(|_| ParseUSizeTupleError)?;
		let y_fromstr = y.parse::<usize>().map_err(|_| ParseUSizeTupleError)?;

		Ok(KeyLink((x_fromstr, y_fromstr)))
	}
}

impl Display for KeyLink {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		let KeyLink((a, b)) = self.clone();
		write!(f, "({},{})", a, b)
	}
}

impl Display for ParseUSizeTupleError {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(f, "Could not parse string into usize.")
	}
}
