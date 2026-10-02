"""Deterministic educational TCP transport simulations for Assignment 2."""
from .models import ProtocolStep, ProtocolField, SimulationResponse

WIN=64240

def _step(i, phase, title, direction, seq, ack, flags, length=0, payload="", cs="ESTABLISHED", ss="ESTABLISHED", sport=49152, dport=80):
    c2s=direction=="client-to-server"; src="Client" if c2s else "Server"; dst="Server" if c2s else "Client"
    raw=(f"TCP {title}\n{src} -> {dst}\nFlags: {flags}\nSeq: {seq}\nAck: {ack}\nWindow: {WIN}\n"
         f"Length: {length} bytes\nPorts: {sport if c2s else dport} -> {dport if c2s else sport}" + (f"\nPayload: {payload}" if payload else ""))
    fields=[ProtocolField(name="Phase",value=phase,highlight=True),ProtocolField(name="Flags",value=flags,highlight=True),ProtocolField(name="Sequence",value=str(seq),highlight=True),ProtocolField(name="Acknowledgement",value=str(ack),highlight=True),ProtocolField(name="Window",value=str(WIN)),ProtocolField(name="Length",value=f"{length} bytes"),ProtocolField(name="Source Port",value=str(sport if c2s else dport)),ProtocolField(name="Destination Port",value=str(dport if c2s else sport)),ProtocolField(name="Client State",value=cs,highlight=True),ProtocolField(name="Server State",value=ss,highlight=True)]
    if payload: fields.append(ProtocolField(name="Application -> TCP Payload",value=payload,highlight=True))
    explanations={"SYN":"Client starts a TCP connection and advertises its initial sequence number.","SYN, ACK":"Server acknowledges the client SYN and synchronizes its own sequence number.","ACK":"This acknowledgement confirms the next byte expected from the peer.","FIN, ACK":"FIN performs an orderly half-close; FIN consumes one TCP sequence number."}
    return ProtocolStep(id=f"tcp-{i}",step_number=i,protocol="TCP",stage=phase.lower().replace(" ","-"),from_endpoint=src,to_endpoint=dst,direction=direction,message_type=title,summary=f"{title}: Seq={seq} Ack={ack} Len={length}",raw_message=raw,explanation=explanations.get(flags, f"TCP carries the application-layer data as payload while preserving reliable, ordered byte delivery."),important_fields=fields,metadata={"seq":seq,"ack":ack,"flags":flags,"length":length,"client_state":cs,"server_state":ss})

def _build(activity, payloads, dport, title):
    steps=[]; i=1; c=1000; s=5000; sport=49152
    steps.append(_step(i,"Connection Establishment","SYN","client-to-server",c,0,"SYN",cs="SYN-SENT",ss="LISTEN",sport=sport,dport=dport)); i+=1; c+=1
    steps.append(_step(i,"Connection Establishment","SYN-ACK","server-to-client",s,c,"SYN, ACK",cs="SYN-SENT",ss="SYN-RECEIVED",sport=sport,dport=dport)); i+=1; s+=1
    steps.append(_step(i,"Connection Establishment","Handshake ACK","client-to-server",c,s,"ACK",cs="ESTABLISHED",ss="ESTABLISHED",sport=sport,dport=dport)); i+=1
    for direction,label,length in payloads:
        if direction=="client-to-server":
            steps.append(_step(i,"Data Transfer",label,direction,c,s,"PSH, ACK",length,label,sport=sport,dport=dport)); c+=length
        elif direction=="server-to-client":
            steps.append(_step(i,"Data Transfer",label,direction,s,c,"PSH, ACK",length,label,sport=sport,dport=dport)); s+=length
        else: # pure client ACK
            steps.append(_step(i,"Data Transfer",label,"client-to-server",c,s,"ACK",0,"",sport=sport,dport=dport))
        i+=1
    steps.append(_step(i,"Connection Teardown","FIN-ACK","client-to-server",c,s,"FIN, ACK",cs="FIN-WAIT-1",ss="ESTABLISHED",sport=sport,dport=dport)); i+=1; c+=1
    steps.append(_step(i,"Connection Teardown","ACK of FIN","server-to-client",s,c,"ACK",cs="FIN-WAIT-2",ss="CLOSE-WAIT",sport=sport,dport=dport)); i+=1
    steps.append(_step(i,"Connection Teardown","Server FIN-ACK","server-to-client",s,c,"FIN, ACK",cs="FIN-WAIT-2",ss="LAST-ACK",sport=sport,dport=dport)); i+=1; s+=1
    steps.append(_step(i,"Connection Teardown","Final ACK","client-to-server",c,s,"ACK",cs="TIME-WAIT",ss="CLOSED",sport=sport,dport=dport));
    return SimulationResponse(activity=activity,protocol_title=title,description="TCP handshake → application payload transport → orderly FIN/ACK teardown. Sequence/ACK values follow byte-stream arithmetic.",endpoints=["Client","Server"],steps=steps,total_steps=len(steps),activity_metadata={"layer":"transport"})

def simulate_transport_browsing():
    return _build("browsing",[("client-to-server","HTTP GET / HTTP/1.1",450),("server-to-client","HTTP Response Segment 1",1200),("server-to-client","HTTP Response Segment 2",800),("ack","Cumulative ACK",0)],80,"Browsing Transport: TCP + HTTP Payload")

def simulate_transport_mail():
    p=[("client-to-server","EHLO client.example.com",25),("server-to-client","250 mail.example.com",22),("client-to-server","MAIL FROM:<student@example.com>",32),("server-to-client","250 OK",8),("client-to-server","RCPT TO:<recipient@example.com>",34),("server-to-client","250 OK",8),("client-to-server","DATA + message body",180),("server-to-client","250 Message accepted",22),("client-to-server","QUIT",6),("server-to-client","221 Bye",9)]
    return _build("mail",p,25,"Mail Transport: TCP carrying SMTP")

def simulate_transport_streaming():
    p=[("client-to-server","HLS Manifest Request",180),("server-to-client","HLS Manifest Response",600),("client-to-server","Media Segment Request",190),("server-to-client","Media Segment #1 part 1/3",1200),("server-to-client","Media Segment #1 part 2/3",1200),("server-to-client","Media Segment #1 part 3/3",1200),("ack","Cumulative ACK for 3600-byte media data",0)]
    return _build("streaming",p,80,"Streaming Transport: TCP carrying HLS/HTTP")
