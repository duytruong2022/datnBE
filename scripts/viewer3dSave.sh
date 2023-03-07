ssh -p "$1" -i "$2" "$3"@"$4" << EOF
   cd /D ${10}
   sh ./repository/saveFile.sh "$5" "$6" "$7" "$8" "$9"
EOF