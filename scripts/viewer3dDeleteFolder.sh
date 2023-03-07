ssh -p "$1" -i "$2" "$3"@"$4" << EOF
   cd /D ${5}
   rmdir /s /q ${6}
EOF