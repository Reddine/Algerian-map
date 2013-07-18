<?php 
/**
 * @Author: 		Kheir Eddine Farfar
 * @Author Github: 	https://github.com/Reddine
 * @Author URI: 	http://www.reddine.com
 * @Description: 	SVG Map Converter to Data Points for jVectorMap and JQVMap jQuery plugin.
 */
$plugin_name = "jVectorMap";
$JSFile = "result.js";
$fh = fopen($JSFile, 'w') or die("can't open file");
$JSFile_Content = "/** \n* @Author: 		Kheir Eddine Farfar \n* @Author Github: 	https://github.com/Reddine \n* @Author URI: 	http://www.reddine.com \n* @Description: 	Algeria Map Data Points for jVectorMap \n*/ \n";
$JSFile_Content .= "jQuery.fn.vectorMap('addMap', 'dz_fr', { 'height': 500, 'width': 508,";
$JSFile_Content .= ($plugin_name == "jVectorMap") ? "paths" : "pathes";
$JSFile_Content .= ":{";
$svg = simplexml_load_file('Wilayas of Algeria.xml') or die("can't open file");
$i=1;
foreach ($svg->g[0] as $path)
{
	$id = explode("_", $path['id']);
	$wilaya = $id[3];
	if($i!=48) $JSFile_Content .= '"'.$i.'":{"path":"'.$path['d'].'","name":"'.$wilaya.'"},';
	else $JSFile_Content .= '"'.$i.'":{"path":"'.$path['d'].'","name":"'.$wilaya.'"}';
	$i++;
}
$JSFile_Content .= "}});";
if(fwrite($fh, $JSFile_Content))
{
	echo "File converted";
}
?>