export const Button = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
