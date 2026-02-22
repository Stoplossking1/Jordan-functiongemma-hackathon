#!/bin/bash
echo "=== System Information ==="
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "glibc: $(ldd --version | head -1)"

echo -e "\n=== CPU Info ==="
if [ -f /proc/cpuinfo ]; then
    grep "flags" /proc/cpuinfo | head -1 | cut -d: -f2 | tr ' ' '\n' | grep -E "(avx|sse|popcnt)" | sort -u
else
    echo "  /proc/cpuinfo not available"
fi

echo -e "\n=== Mounted Filesystems ==="
mount | grep -E "(proc|sys|devpts)"

echo -e "\n=== Library Search Path ==="
ldconfig -p | head -20

echo -e "\n=== Testing Binaries ==="
for cmd in bash node npm; do
    echo "Testing $cmd:"
    which $cmd
    ldd $(which $cmd) 2>&1 | grep "not found" | head -5 || echo "  All libraries found"
done

echo -e "\n=== Directories ==="
ls -la / | grep -E "(proc|sys|dev|tmp|run)"

echo -e "\n=== /proc/self ==="
ls -la /proc/self 2>&1 | head -10 || echo "  /proc/self not accessible"

echo -e "\n=== Temp directories ==="
ls -ld /tmp /var/tmp

echo -e "\n=== XDG Runtime ==="
echo "XDG_RUNTIME_DIR: $XDG_RUNTIME_DIR"
