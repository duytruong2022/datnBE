ssh -p ${11} -i $8 $9@${10} << EOF
   cd /D ${13}
   sh ./generate-thumbnail/generateThumbnail.sh "$1" "$2" "$3" "$4" "$5" "$6" "$7" "${12}"
EOF