#![allow(clippy::tabs_in_doc_comments)]
#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths, unsafe_code)]

//! This is a private implementation detail of the `algorithm` crate. It exists because
//! proc-macros need to be defined in their own crate.

use darling::FromField;
use proc_macro::TokenStream;
use proc_macro2::{Ident, Span, TokenStream as TokenStream2};
use quote::quote;
use syn::{parse_macro_input, spanned::Spanned as _, Attribute, Data, DeriveInput, Expr, Fields, Lit, LitStr, Meta};
use thiserror::Error;

/// An error that can be converted into a compile error. Can be either [`syn::Error`] or
/// [`darling::Error`].
#[derive(Debug, Error)]
enum Error {
	#[error("{0}")]
	Syn(#[from] syn::Error),

	#[error("{0}")]
	Darling(#[from] darling::Error)
}

impl Error {
	/// Turn this error into a token stream with one or morecorrectly spanned
	/// `compile_error!`.
	fn into_compile_error(self) -> TokenStream2 {
		match self {
			Self::Syn(err) => err.into_compile_error(),
			Self::Darling(err) => err.write_errors()
		}
	}
}

/// This proc macro can be used to implement the `Pseudocode` trait. You can derive this
/// macro on enums that have unit and struct variants, but no tuple variants.
///
/// The rustdoc comments of each variant will be parsed as Rust format strings. All
/// variables mentioned must be stored within the variant itself.
///
/// ## Example
///
/// ```rust,ignore
/// #[derive(Clone, Copy, Debug, Eq, PartialEq, Pseudocode)]
/// enum MyAlgoPseudocode {
/// 	Initialise,
///
/// 	/// Eat {food}.
/// 	Eat {
/// 		food: &'static str
/// 	},
///
/// 	/// Sleep for {hours}.
/// 	Sleep {
/// 		hours: usize
/// 	},
///
/// 	/// Repeat.
/// 	Repeat
/// }
/// ```
#[proc_macro_derive(Pseudocode, attributes(pseudocode))]
#[allow(clippy::let_and_return)]
pub fn pseudocode(input: TokenStream) -> TokenStream {
	let code = expand_pseudocode(parse_macro_input!(input))
		.unwrap_or_else(Error::into_compile_error)
		.into();

	// uncomment this line if you want to debug the macro output
	// don't forget to re-comment this line before pushing any changes to the main branch
	// eprintln!("{code}");

	code
}

/// This struct collects all arguments that can be passed to this macro per variant.
#[derive(FromField)]
#[darling(attributes(pseudocode))]
struct VariableArgs {
	rename: Option<String>
}

/// This struct collects information this macro needs about each variable in a variant.
struct Variable {
	ident: Ident,
	name: String
}

/// This struct collects information this macro needs about each variant.
struct Variant {
	ident: Ident,
	index: usize,
	docs: String,
	variables: Vec<Variable>
}

/// This function extracts rustdoc attributes from the given list of attributes. While it
/// is impossible to replicate the functionality of rustdoc 100%, this approach gets us
/// as close as possible.
fn collect_doc(attrs: &[Attribute]) -> String {
	let mut doc = Vec::new();

	// collect all doc attributes
	for attr in attrs {
		if attr.path().is_ident("doc") {
			if let Meta::NameValue(kv) = &attr.meta {
				doc.extend(
					kv.value
						.clone()
						.expect_str()
						.unwrap()
						.value()
						.split('\n')
						.map(String::from)
				);
			}
		}
	}

	// remove common whitespace
	if doc.iter().all(|line| line.starts_with(' ')) {
		for line in &mut doc {
			line.remove(0);
		}
	}

	// join all attributes with newlines
	doc.join("\n")
}

/// This function extracts all variables from the field of a variant.
fn collect_variables(fields: &Fields) -> Result<Vec<Variable>, Error> {
	let fields = match fields {
		Fields::Named(fields) => &fields.named,
		Fields::Unit => return Ok(Vec::new()),
		Fields::Unnamed(u) => {
			return Err(syn::Error::new(u.span(), "Tuple variants are not supported for Pseudocode").into())
		},
	};

	fields
		.iter()
		.map(|f| {
			let attrs = VariableArgs::from_field(f)?;
			let ident = f.ident.clone().expect("Named fields should always have an ident");
			let name = attrs.rename.unwrap_or_else(|| ident.to_string());
			Ok(Variable { ident, name })
		})
		.collect()
}

/// This method implements the `#[derive(Pseudocode)]` macro.
fn expand_pseudocode(input: DeriveInput) -> Result<TokenStream2, Error> {
	let ident = &input.ident;

	// make sure our input is an enum
	let Data::Enum(inum) = &input.data else {
		return Err(syn::Error::new(Span::call_site(), "#[derive(Pseudocode)] only works on enums").into());
	};

	// grab the first variant and make sure that it exists
	let first_ast_variant = inum.variants.first().ok_or_else(|| {
		syn::Error::new(
			Span::call_site(),
			"cannot derive Pseudocode: enum must have at least one variant"
		)
	})?;

	// check that this first variant is unit
	if !matches!(first_ast_variant.fields, syn::Fields::Unit) {
		return Err(syn::Error::new_spanned(
			first_ast_variant,
			"cannot derive Pseudocode: the first variant must be unit-style (no fields)"
		)
		.into());
	}

	// collect all variants of the enum
	let variants = inum
		.variants
		.iter()
		.enumerate()
		.map(|(index, variant)| {
			Ok(Variant {
				ident: variant.ident.clone(),
				index,
				docs: collect_doc(&variant.attrs),
				variables: collect_variables(&variant.fields)?
			})
		})
		.collect::<Result<Vec<_>, Error>>()?;

	// we need the first variant for implementing the `start()` function.
	let first_variant = &variants[0].ident;

	// some basic information about the variants
	let variant_idents = variants.iter().map(|v| &v.ident);
	let variant_index = variants.iter().map(|v| &v.index);

	// parse each variant's doc and output it as a `&[PseudocodeText]` array
	let variant_docs = variants.iter().map(|v| {
		let mut pseudocode = Vec::new();
		for token in fmtparse::parse_relaxed(&v.docs).expect("Invalid format string") {
			pseudocode.push(match token {
				fmtparse::Token::Text(text) => quote!(::algorithm::PseudocodeText::Text(#text)),
				fmtparse::Token::Variable {
					name: fmtparse::VarName::Ident(ident),
					..
				} => {
					if v.variables.iter().all(|field| field.name != ident) {
						syn::Error::new(v.ident.span(),
							format!("This variant's documentation mentions variable `{ident}` but I cannot find a value for this variable")
						).into_compile_error()
					} else {
						quote!(::algorithm::PseudocodeText::Variable(#ident))
					}
				},
				_ => syn::Error::new(v.ident.span(), "Format string must not have variables without a name")
					.into_compile_error()
			});
		}

		quote!(&[#(#pseudocode,)*])
	});

	// create code for each variant that adds all variables of the variant to a map
	let variant_variables = variants.iter().map(|v| {
		let ident = &v.ident;
		let vars = v.variables.iter().map(|v| &v.ident).collect::<Vec<_>>();
		let names = v.variables.iter().map(|v| &v.name);
		quote! {
			Self::#ident { #(#vars),* } => {
				#(vars.insert(#names, ::algorithm::private::to_value(&#vars).unwrap());)*
			}
		}
	});

	// put all of the code together
	Ok(quote! {
		impl ::algorithm::Pseudocode for #ident {
			const DESCRIPTION: &'static [&'static [::algorithm::PseudocodeText]]
				= &[#(#variant_docs,)*];

			fn start() -> Self {
				Self::#first_variant
			}

			fn line(&self) -> usize {
				match self {
					#(Self::#variant_idents {..} => #variant_index,)*
				}
			}

			fn variables(&self) -> ::algorithm::Variables {
				let mut vars = ::algorithm::Variables::new();
				match self {
					#(#variant_variables),*
				}
				vars
			}
		}
	})
}

/// This is a utility trait for dealing with literals and literal-like types.
pub(crate) trait ExpectLit {
	/// Expect this type to be a string literal.
	fn expect_str(self) -> syn::Result<LitStr>;
}

impl ExpectLit for Lit {
	fn expect_str(self) -> syn::Result<LitStr> {
		match self {
			Self::Str(str) => Ok(str),
			_ => Err(syn::Error::new(self.span(), "Expected string literal"))
		}
	}
}

impl ExpectLit for Expr {
	fn expect_str(self) -> syn::Result<LitStr> {
		match self {
			Expr::Lit(lit) => lit.lit.expect_str(),
			_ => Err(syn::Error::new(self.span(), "Expected string literal"))
		}
	}
}
