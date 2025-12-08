use algorithm::{
	Pseudocode,
	PseudocodeText::{Text, Variable}
};

#[derive(Clone, Pseudocode)]
#[allow(dead_code)] // we're testing a macro here
enum MyPseudocode {
	/// Hallo Welt
	Line0,

	/// {i} Hallo Welt
	Line1 { i: usize },

	/// Hallo {i} Welt
	Line2 { i: usize },

	/// Hallo Welt {i}
	Line3 { i: usize },

	/// {i} Hallo {j} Welt {k}
	Line4 { i: usize, j: usize, k: usize },

	/// Hallo {{{name}}}
	Line5 { name: String }
}

#[test]
fn test_description_0() {
	assert_eq!(MyPseudocode::DESCRIPTION[0], &[Text("Hallo Welt")]);
}

#[test]
fn test_description_1() {
	assert_eq!(MyPseudocode::DESCRIPTION[1], &[Variable("i"), Text(" Hallo Welt")]);
}

#[test]
fn test_description_2() {
	assert_eq!(MyPseudocode::DESCRIPTION[2], &[
		Text("Hallo "),
		Variable("i"),
		Text(" Welt")
	]);
}

#[test]
fn test_description_3() {
	assert_eq!(MyPseudocode::DESCRIPTION[3], &[Text("Hallo Welt "), Variable("i")]);
}

#[test]
fn test_description_4() {
	assert_eq!(MyPseudocode::DESCRIPTION[4], &[
		Variable("i"),
		Text(" Hallo "),
		Variable("j"),
		Text(" Welt "),
		Variable("k")
	]);
}

#[test]
fn test_description_5() {
	assert_eq!(MyPseudocode::DESCRIPTION[5], &[
		Text("Hallo {"),
		Variable("name"),
		Text("}")
	]);
}
