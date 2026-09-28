import { Component } from "react";

// Catches render errors below it so one broken page shows a recoverable
// message instead of unmounting the whole app (a blank white screen).
// App keys it by page, so switching tabs clears the error automatically.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="error-boundary" role="alert">
        <h2>Something went wrong on this page</h2>
        <p>Your saved progress is safe. Try again, or head back to the dashboard.</p>
        <p className="error-boundary-detail">{String(this.state.error?.message || this.state.error)}</p>
        <div className="error-boundary-actions">
          <button type="button" className="btn-secondary" onClick={this.handleRetry}>
            Try again
          </button>
          {this.props.onReset && (
            <button type="button" className="btn-secondary" onClick={this.props.onReset}>
              {this.props.resetLabel || "Go to Dashboard"}
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
