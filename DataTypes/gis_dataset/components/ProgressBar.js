// https://www.geeksforgeeks.org/how-to-create-a-custom-progress-bar-component-in-react-js/

export default function ProgressBar({ progress }) {
  const Parentdiv = {
    display: "inline-block",
    height: "100%",
    width: "100%",
    backgroundColor: "whitesmoke",
    borderRadius: 40,
    margin: 50,
  };

  const Childdiv = {
    display: "inline-block",
    height: "84%",
    width: `${progress}`,
    backgroundColor: "#3b82f680",
    borderRadius: 40,
    textAlign: "right",
  };

  const progresstext = {
    padding: 10,
    color: "black",
    fontWeight: 900,
  };

  return (
    <div style={Parentdiv}>
      <span
        style={{
          fontWeight: "bold",
          paddingLeft: "10px",
          paddingRight: "10px",
        }}
      >
        {" "}
        Sent:
      </span>

      <div style={Childdiv}>
        <span style={progresstext}>{`${progress}`}</span>
      </div>
    </div>
  );
}
