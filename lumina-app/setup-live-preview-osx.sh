#!/bin/bash

# Script to automate preparing a mounted SSH folder using mutagen
# This sets up a sync session between a remote workspace and local folder
# It then starts the expo development server in the local folder

set -e

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "Error: This script only runs on macOS."
    exit 1
fi

# Configuration - these placeholders need to be replaced with actual values
CONNECTION_STRING="emerald-crawdad-443@ec2-54-67-28-46.us-west-1.compute.amazonaws.com"
PASSWORD="qLoMpxQ=8LGaK:Ko.jXzK_GJS"
LOCAL_SYNC_PATH="~/woz-live-preview"
REMOTE_PATH="/workspace"

# Suppress mutagen debug messages
export MUTAGEN_LOG_LEVEL=warn

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check which tools need to be installed
check_missing_tools() {
    HOMEBREW_MISSING=false
    MISSING_TOOLS=()

    if ! command -v brew &> /dev/null; then
        HOMEBREW_MISSING=true
    fi

    if ! command -v mutagen &> /dev/null; then
        MISSING_TOOLS+=("mutagen (file synchronization)")
    fi

    if ! command -v expect &> /dev/null; then
        MISSING_TOOLS+=("expect (for automated password input)")
    fi
}

# Install Homebrew
install_homebrew() {
    log_info "Installing Homebrew..."
    # Allow installer to fail - we'll check for success by looking for the binary
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || true

    # Add Homebrew to PATH for this session
    # Apple Silicon Macs: /opt/homebrew, Intel Macs: /usr/local
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
        log_info "Homebrew installed successfully"
    elif [[ -f "/usr/local/bin/brew" ]]; then
        eval "$(/usr/local/bin/brew shellenv)"
        log_info "Homebrew installed successfully"
    else
        log_error "Homebrew installation failed. Please install manually and try again."
        exit 1
    fi
}

# Prompt for installation if tools are missing
prompt_for_installation() {
    # Build the list of items to install
    local INSTALL_ITEMS=()

    if [ "$HOMEBREW_MISSING" = true ]; then
        INSTALL_ITEMS+=("Homebrew (package manager)")
    fi

    for tool in "${MISSING_TOOLS[@]}"; do
        INSTALL_ITEMS+=("$tool")
    done

    # If nothing is missing, return early
    if [ ${#INSTALL_ITEMS[@]} -eq 0 ]; then
        return
    fi

    echo ""
    echo "The following tools need to be installed:"
    for item in "${INSTALL_ITEMS[@]}"; do
        echo "  - $item"
    done
    echo ""
    echo -n "Do you wish to proceed with installation? (y/n): "
    read -r CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi

    # Install Homebrew first if missing
    if [ "$HOMEBREW_MISSING" = true ]; then
        install_homebrew
    fi
}

# Step 1: Check if mutagen is installed, install if not
check_and_install_mutagen() {
    log_info "Checking if mutagen is installed..."

    if command -v mutagen &> /dev/null; then
        log_info "Mutagen is already installed: $(mutagen version)"
    else
        log_info "Installing mutagen via Homebrew..."
        brew install mutagen-io/mutagen/mutagen
        log_info "Mutagen installed successfully: $(mutagen version)"
    fi
}

# Step 2: Remove and recreate the local sync folder
prepare_local_folder() {
    log_info "Preparing local sync folder: $LOCAL_SYNC_PATH"

    # Expand tilde for proper path handling
    local EXPANDED_PATH="${LOCAL_SYNC_PATH/#\~/$HOME}"

    if [ -d "$EXPANDED_PATH" ]; then
        log_info "Removing existing folder..."
        rm -rf "$EXPANDED_PATH"
    fi

    log_info "Creating fresh folder..."
    mkdir -p "$EXPANDED_PATH"
    log_info "Local folder prepared successfully"
}

# Validate that placeholders have been replaced
validate_configuration() {
    if [[ "$CONNECTION_STRING" == "["*"]" ]]; then
        log_error "CONNECTION_STRING has not been configured. Please replace the placeholder with actual value."
        exit 1
    fi

    if [[ "$PASSWORD" == "["*"]" ]]; then
        log_error "PASSWORD has not been configured. Please replace the placeholder with actual value."
        exit 1
    fi

    # Basic validation for user@host format
    if [[ ! "$CONNECTION_STRING" =~ ^[^@]+@[^@]+$ ]]; then
        log_error "Invalid connection string format. Expected: user@hostname"
        exit 1
    fi

    log_info "Connection string: $CONNECTION_STRING"
}

# Step 5: Terminate any existing sync sessions for this path
terminate_existing_sessions() {
    log_info "Checking for existing sync sessions..."

    # Expand tilde for matching against mutagen output
    local EXPANDED_PATH="${LOCAL_SYNC_PATH/#\~/$HOME}"

    # List sessions and check if any match our paths (check both tilde and expanded path)
    if mutagen sync list 2>/dev/null | grep -qE "($LOCAL_SYNC_PATH|$EXPANDED_PATH)"; then
        log_warn "Found existing sync session. Terminating..."
        # Terminate all sessions - mutagen sync terminate with --all flag
        # We use the session identifier approach by finding it first
        local SESSION_ID
        SESSION_ID=$(mutagen sync list 2>/dev/null | grep -B 20 "$EXPANDED_PATH" | grep "Identifier:" | head -1 | awk '{print $2}')
        if [ -n "$SESSION_ID" ]; then
            log_info "Terminating session: $SESSION_ID"
            mutagen sync terminate "$SESSION_ID" 2>/dev/null || true
        fi
        # Also try terminating by path match
        mutagen sync terminate "$EXPANDED_PATH" 2>/dev/null || true
        mutagen sync terminate "$LOCAL_SYNC_PATH" 2>/dev/null || true

        # Wait for session to fully terminate (poll until gone)
        local MAX_WAIT_SEC=30
        local WAITED=0
        while [ $WAITED -lt $MAX_WAIT_SEC ]; do
            if ! mutagen sync list 2>/dev/null | grep -qE "($LOCAL_SYNC_PATH|$EXPANDED_PATH)"; then
                log_info "Sync session terminated successfully"
                return 0
            fi
            sleep 1
            WAITED=$((WAITED + 1))
        done
        log_warn "Timeout waiting for session termination, proceeding anyway"
    fi
}

# Track if cleanup has already run to prevent double execution
CLEANUP_DONE=false
# Track if sync session was started (only cleanup if true)
SYNC_STARTED=false

# Cleanup: terminate sync session and remove local folder
cleanup() {
    # Prevent double cleanup (trap can fire multiple times)
    if [ "$CLEANUP_DONE" = true ]; then
        return
    fi
    CLEANUP_DONE=true

    # Only cleanup if we actually started a sync session
    if [ "$SYNC_STARTED" = false ]; then
        return
    fi

    log_info "Cleaning up..."

    # Expand tilde for folder removal
    EXPANDED_PATH="${LOCAL_SYNC_PATH/#\~/$HOME}"

    # Terminate sync session first (must happen before folder removal)
    # terminate_existing_sessions now waits for the session to be fully gone
    terminate_existing_sessions

    # Remove local sync folder
    if [ -d "$EXPANDED_PATH" ]; then
        log_info "Removing local sync folder..."
        rm -rf "$EXPANDED_PATH" 2>/dev/null || {
            # If rm fails, try again after a short delay
            sleep 2
            rm -rf "$EXPANDED_PATH" 2>/dev/null || log_warn "Could not fully remove sync folder. You may need to manually delete: $EXPANDED_PATH"
        }
        if [ ! -d "$EXPANDED_PATH" ]; then
            log_info "Local sync folder removed"
        fi
    fi
}

# Step 6: Start the mutagen sync session with auto password input
start_sync_session() {
    log_info "Starting mutagen sync session..."
    log_info "Remote: ${CONNECTION_STRING}:${REMOTE_PATH}"
    log_info "Local: ${LOCAL_SYNC_PATH}"

    # Create the sync session using expect to handle password prompts
    # We use expect because mutagen may prompt for password multiple times

    if ! command -v expect &> /dev/null; then
        log_info "Installing expect via Homebrew..."
        brew install expect
    fi

    log_info "Creating sync session (this may take a moment)..."

    # Export variables for expect to access
    export MUTAGEN_CONN="${CONNECTION_STRING}:${REMOTE_PATH}"
    export MUTAGEN_LOCAL="${LOCAL_SYNC_PATH}"
    export MUTAGEN_PASS="${PASSWORD}"

    # Use expect to handle multiple password prompts
    expect << 'EXPECT_EOF'
set timeout 120
spawn mutagen sync create "$env(MUTAGEN_CONN)" "$env(MUTAGEN_LOCAL)"

# Handle multiple password prompts
expect {
    -re "password:|Password:" {
        send "$env(MUTAGEN_PASS)\r"
        exp_continue
    }
    -re "yes/no" {
        send "yes\r"
        exp_continue
    }
    -re "Are you sure you want to continue connecting" {
        send "yes\r"
        exp_continue
    }
    "Created session" {
        puts "\nSync session created successfully"
    }
    timeout {
        puts "\nTimeout waiting for sync session creation"
        exit 1
    }
    eof {
        # Check if we got a successful exit
    }
}
EXPECT_EOF

    if [ $? -eq 0 ]; then
        SYNC_STARTED=true
        log_info "Sync session started successfully!"
        log_info "Waiting for initial sync to complete..."

        # Expand tilde for file checks
        EXPANDED_PATH="${LOCAL_SYNC_PATH/#\~/$HOME}"

        # Wait for mutagen to report "Watching for changes" which means initial sync is done
        MAX_WAIT_SEC=300
        WAITED=0
        SYNC_COMPLETE=false
        while [ $WAITED -lt $MAX_WAIT_SEC ]; do
            # Check mutagen sync status - "Watching for changes" means sync is idle/complete
            SYNC_STATUS=$(mutagen sync list 2>/dev/null | grep -A 20 "$EXPANDED_PATH" | grep "Status:" | head -1 | sed 's/.*Status: //')
            echo $SYNC_STATUS
            if [[ "$SYNC_STATUS" == "Watching for changes" ]]; then
                SYNC_COMPLETE=true
                log_info "Initial sync complete!"
                break
            fi
            sleep 2
            WAITED=$((WAITED + 2))
            # Show current status
            echo -n "."
        done
        echo ""

        if [ "$SYNC_COMPLETE" = true ]; then
            log_info "Starting live preview..."
            cd "$EXPANDED_PATH" && npx expo start
        else
            log_warn "Timeout waiting for sync. Current status: $SYNC_STATUS"
            log_warn "You may start expo manually once sync completes: cd $EXPANDED_PATH && npx expo start"
        fi
        # cleanup is handled by trap on EXIT
    else
        log_error "Failed to create sync session"
        exit 1
    fi
}

# Trap to ensure cleanup runs on exit (normal, Ctrl+C, or kill)
trap cleanup EXIT INT TERM

# Main execution
main() {
    echo "========================================"
    echo "  Woz Local Live Preview Setup Script"
    echo "========================================"

    validate_configuration

    check_missing_tools
    prompt_for_installation

    check_and_install_mutagen
    echo ""

    # Terminate existing sessions BEFORE touching the local folder
    # to prevent mutagen from syncing deletions to remote
    terminate_existing_sessions
    echo ""

    prepare_local_folder
    echo ""
    

    start_sync_session
    echo ""

    echo "========================================"
    echo "  Woz Live Preview Ended!"
    echo "========================================"
}

main "$@"
