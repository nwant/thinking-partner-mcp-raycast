import { Action, ActionPanel, Form, List, showToast, Toast, Icon, Color } from "@raycast/api";
import { useState, useEffect } from "react";
import { getCurrentFocus, setFocus, getFocusHistory, Focus, disconnectFromMCP } from "./mcp-client";

export default function Command() {
  const [currentFocus, setCurrentFocus] = useState<Focus | null>(null);
  const [focusHistory, setFocusHistory] = useState<Focus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFocusData();
    return () => {
      disconnectFromMCP().catch(console.error);
    };
  }, []);

  async function loadFocusData() {
    try {
      setIsLoading(true);
      const [focusData, history] = await Promise.all([getCurrentFocus(), getFocusHistory()]);
      setCurrentFocus(focusData.currentFocus);
      setFocusHistory(history);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Failed to load focus data:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to connect to MCP server",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSetFocus(values: { topic: string; context: string }) {
    try {
      const newFocus = await setFocus({
        topic: values.topic,
        context: values.context,
        tool: "desktop",
      });
      setCurrentFocus(newFocus);
      await loadFocusData();
      setShowForm(false);
      showToast({
        style: Toast.Style.Success,
        title: "Focus set",
        message: `Now focusing on: ${values.topic}`,
      });
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to set focus",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (showForm) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm onSubmit={handleSetFocus} title="Set Focus" />
            <Action title="Cancel" onAction={() => setShowForm(false)} />
          </ActionPanel>
        }
      >
        <Form.TextField id="topic" title="Focus Topic" placeholder="What are you working on?" autoFocus />
        <Form.TextArea id="context" title="Context" placeholder="Additional context or details (optional)" />
      </Form>
    );
  }

  return (
    <List isLoading={isLoading}>
      {error && (
        <List.Section title="Connection Error">
          <List.Item
            title="Failed to connect to MCP server"
            subtitle={error}
            icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
            actions={
              <ActionPanel>
                <Action title="Retry" onAction={loadFocusData} icon={Icon.ArrowClockwise} />
              </ActionPanel>
            }
          />
        </List.Section>
      )}
      <List.Section title="Current Focus">
        {currentFocus ? (
          <List.Item
            title={currentFocus.topic}
            subtitle={currentFocus.context}
            accessories={[
              { text: formatDate(currentFocus.startedAt), icon: Icon.Clock },
              { tag: { value: currentFocus.status, color: Color.Green } },
            ]}
            actions={
              <ActionPanel>
                <Action title="Set New Focus" onAction={() => setShowForm(true)} icon={Icon.Plus} />
                <Action title="Refresh" onAction={loadFocusData} icon={Icon.ArrowClockwise} />
              </ActionPanel>
            }
          />
        ) : (
          <List.Item
            title="No active focus"
            subtitle="Set a focus to get started"
            actions={
              <ActionPanel>
                <Action title="Set New Focus" onAction={() => setShowForm(true)} icon={Icon.Plus} />
                <Action title="Refresh" onAction={loadFocusData} icon={Icon.ArrowClockwise} />
              </ActionPanel>
            }
          />
        )}
      </List.Section>

      {focusHistory.length > 0 && (
        <List.Section title="Focus History">
          {focusHistory
            .filter((focus) => focus.id !== currentFocus?.id)
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
            .map((focus) => (
              <List.Item
                key={focus.id}
                title={focus.topic}
                subtitle={focus.context}
                accessories={[
                  { text: formatDate(focus.startedAt), icon: Icon.Clock },
                  {
                    tag: {
                      value: focus.status,
                      color: focus.status === "completed" ? Color.SecondaryText : Color.Blue,
                    },
                  },
                ]}
                actions={
                  <ActionPanel>
                    <Action
                      title="Resume Focus"
                      onAction={async () => {
                        await handleSetFocus({ topic: focus.topic, context: focus.context });
                      }}
                      icon={Icon.Play}
                    />
                    <Action title="Set New Focus" onAction={() => setShowForm(true)} icon={Icon.Plus} />
                    <Action title="Refresh" onAction={loadFocusData} icon={Icon.ArrowClockwise} />
                  </ActionPanel>
                }
              />
            ))}
        </List.Section>
      )}
    </List>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
