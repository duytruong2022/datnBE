ssh -p "$1" -i "$2" "$3"@"$4" << EOF
   cd /D ${10}
   sh ./server-log/uploadInstanceLog.sh "$5" "$6" "$7" "$8" "$9"
EOF