import { X } from "lucide-react";
import React, { ReactNode } from "react";

interface ModalProps {
	id: string;
	className?: string;
	title?: string;
	body: ReactNode;
	action?: ReactNode;
	hideClose?: boolean;
}

interface ModalToggleProps {
	id: string;
	className?: string;
	children: ReactNode;
}

export const toggleModal = (id: string): void => {
	const modal = document.getElementById(id) as HTMLDialogElement | null;
	if (modal == null) return;

	if (modal.open) {
		modal.close();
	} else {
		modal.showModal();
	}
};

export const ModalToggle: React.FC<ModalToggleProps> = ({ id, className, children }) => (
	<button
		type="button"
		onClick={() => toggleModal(id)}
		className={className}
	>
		{children}
	</button>
);

export const Modal: React.FC<ModalProps> = ({ id, className = "", title, body, hideClose = false }) => {
	return (
		<dialog
			id={id}
			className={`modal ${className}`}
		>
			<div className="modal-box">
				{!hideClose && (
					<form method="dialog">
						<button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
							<X />
						</button>
					</form>
				)}
				{title !== null && <h3 className="text-lg font-bold">{title}</h3>}
				<div className="py-4">{body}</div>
			</div>

			{/* To close the modal when user clicks outside */}
			<form
				method="dialog"
				className="modal-backdrop"
			>
				<button>close</button>
			</form>
		</dialog>
	);
};

export const ModalKit: React.FC<ModalProps & ModalToggleProps> = ({
	id,
	className,
	children,
	title,
	body,
	action,
	hideClose,
}) => (
	<>
		<ModalToggle
			id={id}
			className={className}
		>
			{children}
		</ModalToggle>
		<Modal
			id={id}
			className={className}
			title={title}
			body={body}
			action={action}
			hideClose={hideClose}
		/>
	</>
);
