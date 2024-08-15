import { ToastContainer, Bounce, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

const Notification = () => {
	return (
		<ToastContainer
			position="top-right"
			autoClose={3000}
			hideProgressBar
			newestOnTop={false}
			closeOnClick
			rtl={false}
			pauseOnFocusLoss
			draggable={false}
			pauseOnHover
			theme="colored"
			transition={Bounce}
		/>
	)
}

export const notifyError = (msg: string) => {
	toast.error(msg, {
		position: "top-right",
		autoClose: 3000,
		hideProgressBar: true,
		closeOnClick: true,
		pauseOnHover: false,
		draggable: false,
		progress: undefined,
		theme: "colored",
		transition: Bounce,
	});
};

export default Notification;
