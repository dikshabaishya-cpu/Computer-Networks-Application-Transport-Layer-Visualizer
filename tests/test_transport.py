from backend.transport_simulator import simulate_transport_browsing, simulate_transport_mail, simulate_transport_streaming

def fields(step): return step.metadata

def validate(seq):
    s=seq.steps
    assert fields(s[0])["seq"]==1000 and fields(s[0])["flags"]=="SYN"
    assert fields(s[1])["ack"]==1001 and fields(s[1])["seq"]==5000
    assert fields(s[2])["seq"]==1001 and fields(s[2])["ack"]==5001
    # Independently track next sequence byte in each direction; SYN/FIN consume one byte.
    c,srv=1001,5001
    for x in s[3:]:
        m=fields(x); direction=x.direction
        assert m["seq"] == (c if direction=="client-to-server" else srv)
        assert m["ack"] == (srv if direction=="client-to-server" else c)
        consume=m["length"] + (1 if "FIN" in m["flags"] else 0)
        if direction=="client-to-server": c += consume
        else: srv += consume
    assert fields(s[-1])["flags"]=="ACK"
    assert fields(s[-1])["client_state"]=="TIME-WAIT"
    assert fields(s[-1])["server_state"]=="CLOSED"

def test_browsing_tcp_arithmetic(): validate(simulate_transport_browsing())
def test_mail_tcp_arithmetic(): validate(simulate_transport_mail())
def test_streaming_tcp_arithmetic():
    q=simulate_transport_streaming(); validate(q)
    media=[x for x in q.steps if "part" in x.message_type]
    assert [fields(x)["length"] for x in media]==[1200,1200,1200]
    assert fields(media[1])["seq"] == fields(media[0])["seq"] + 1200
    assert fields(media[2])["seq"] == fields(media[1])["seq"] + 1200
    ack=[x for x in q.steps if x.message_type.startswith("Cumulative ACK")][0]
    assert fields(ack)["ack"] == fields(media[-1])["seq"] + 1200
