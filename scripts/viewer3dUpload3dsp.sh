ssh -p ${1} -i $2 $3@${4} << EOF
    cd /D $5
    sh ./generate-thumbnail/generateFile3dsp.sh "$6" "$8" "$7" "$9" "${10}" "${11}"
EOF