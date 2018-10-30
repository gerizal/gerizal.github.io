<?php
require __DIR__ . '/vendor/autoload.php';
use Twilio\Rest\Client;
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "bitcoin";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 

function btcid_query($method, array $req = array()) {
 
 // generate the extra headers
 // our curl handle (initialize if required)
 static $ch = null;
 if (is_null($ch)) {
 $ch = curl_init();
 curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
 curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/4.0 (compatible; INDODAXCOM PHP client;
'.php_uname('s').'; PHP/'.phpversion().')');
 }
 curl_setopt($ch, CURLOPT_URL, 'https://indodax.com/api/summaries');
 curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
 // run the query
 $res = curl_exec($ch);
 if ($res === false) throw new Exception('Could not get reply: '.curl_error($ch));
 $dec = json_decode($res, true);
 if (!$dec) throw new Exception('Invalid data received, please make sure connection is working and
requested API exists: '.$res);
 curl_close($ch);
 $ch = null;
 return $dec;
}
function sendSMS($data) {
      // Your Account SID and Auth Token from twilio.com/console
        $sid = 'AC8e2750ec8acec97be8c614d8cf323e23';
        $token = 'd24257cd283fd6a3976cfcbb330bf812';
        $client = new Client($sid, $token);
        
        // Use the client to do fun stuff like send text messages!
         return $client->messages->create(
            // the number you'd like to send the message to
            $data['phone'],
            array(
                // A Twilio phone number you purchased at twilio.com/console
                "from" => "+19287234117",
                // the body of the text message you'd like to send
                'body' => $data['text']
            )
        );
}
$result = btcid_query('getInfo');
$balance =$result['tickers']['eth_idr']['last'];
$data['text'] = 'last price- '.$result['tickers']['eth_idr']['last'];
$data['phone'] = '+6285603117133';


$sql="SELECT * FROM balance";

if($balance > 4000000){
    sendSMS($data);
}




?>